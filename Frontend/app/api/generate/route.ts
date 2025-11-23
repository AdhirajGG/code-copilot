// import { NextResponse, NextRequest } from 'next/server';
// import { prisma } from '@/lib/prisma';


// import { generateSchema } from '@/lib/validators';

// const MODEL_ID = "openai/gpt-oss-20b";
// const HF_URL = "https://router.huggingface.co/v1/chat/completions";


// function jsonOk(data: any) {
//   return NextResponse.json({ success: true, data });
// }
// function jsonErr(message: string, status = 500) {
//   return NextResponse.json({ success: false, error: { message } }, { status });
// }

// const MAX_CODE_LENGTH = 200_000; 

// async function callHuggingFace(
//   prompt: string,
//   language: string,
//   retries = 3,
//   initialMaxTokens = 800,
//   maxCapTokens = 8000
// ): Promise<string> {
//   let attempt = 0;

//   while (attempt < retries) {
//     attempt++;
//     let max_tokens = initialMaxTokens;

//     while (max_tokens <= maxCapTokens) {
//       try {
//         console.log(`[HF] Attempt ${attempt}/${retries} — max_tokens=${max_tokens}`);
//         const resp = await fetch(HF_URL, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${process.env.HF_TOKEN}`,
//           },
//           body: JSON.stringify({
//             model: MODEL_ID,
//             messages: [
//               { role: "system", content: `You are a coding assistant. Write valid ${language} code.` },
//               { role: "user", content: prompt }
//             ],
//             temperature: 0.1,
//             max_tokens,
//             top_p: 1.0,
//           }),
//         });

//         if (resp.status === 503) {
//           const j = await resp.json().catch(() => ({}));
//           const wait = j.estimated_time || 10;
//           console.log(`[HF] Model loading; waiting ${wait}s`);
//           await new Promise(r => setTimeout(r, wait * 1000));
//           continue;
//         }

//         if (!resp.ok) {
//           const text = await resp.text().catch(() => "<no-body>");
//           console.error(`[HF] HTTP ${resp.status}: ${text}`);
//           if (resp.status === 410 || resp.status === 404) return "";
//           break; 
//         }

//         const data = await resp.json();
//         const choice = data?.choices?.[0];
//         const content = choice?.message?.content?.trim() ?? "";
//         const finish = choice?.finish_reason ?? null;
//         console.log(`[HF] finish_reason=${finish}`);

//         if (finish === "length" && max_tokens < maxCapTokens) {
//           max_tokens = Math.min(max_tokens * 2, maxCapTokens);
//           console.log(`[HF] Response truncated. Increasing max_tokens -> ${max_tokens} and retrying.`);
//           await new Promise(r => setTimeout(r, 500));
//           continue;
//         }

//         return content;
//       } catch (err) {
//         console.error(`[HF] network error on attempt ${attempt}:`, err);
//         await new Promise(r => setTimeout(r, 1000 * attempt));
//         break;
//       }
//     }

//     await new Promise(r => setTimeout(r, 1000 * attempt));
//   }

//   return "";
// }


// export async function POST(request: Request) {
//   try {

//     const body = await request.json();
//     const parsed = generateSchema.safeParse(body);
//     if (!parsed.success) {
 
//       const firstErr = parsed.error.issues?.[0];
//       const message = firstErr ? `${firstErr.path.join('.')}: ${firstErr.message}` : 'Invalid input';
//       return jsonErr(message, 400);
//     }
//     const { prompt, language } = parsed.data;

//     console.log(`[Backend] Generating ${language} code... (prompt length: ${prompt.length})`);

  
//     const generatedCodeRaw = await callHuggingFace(prompt, language);


//     let generatedCode = generatedCodeRaw;
//     if (!generatedCode) {
//       console.warn('[Backend] HF returned empty result; using fallback message');
//       generatedCode = `// [ERROR] API failed. Here is a fallback.\n// Prompt: ${prompt}\n\n// TODO: Check server logs for HTTP 410/429 errors.\n`;
//     } else {
//       console.log('[Backend] Code generated successfully');
//     }


//     const codeToSave =
//       generatedCode.length > MAX_CODE_LENGTH
//         ? generatedCode.slice(0, MAX_CODE_LENGTH) + '\n/* truncated */'
//         : generatedCode;

 
//     const user = await prisma.user.upsert({
//       where: { username: 'demo_user' },
//       update: {},
//       create: { username: 'demo_user' },
//     });

//     const record = await prisma.generation.create({
//       data: {
//         prompt,
//         language,
//         code: codeToSave,
//         userId: user.id,
//       },
//     });


//     return jsonOk(record);

//   } catch (error: any) {

//     console.error('[Backend] Exception in POST /api/generate:', error);

//     if (error?.message?.includes('Network') || error?.message?.includes('Upstream')) {
//       return jsonErr('Generation service unavailable', 503);
//     }
//     return jsonErr('Internal server error', 500);
//   }
// }

// Frontend/app/api/generate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateSchema } from "@/lib/validators";

const MODEL_ID = "openai/gpt-oss-20b";
const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MAX_CODE_LENGTH = 200_000;

/**
 * Robust HF call with retry + adaptive max_tokens
 * (keeps your original logic but cleaned up for clarity)
 */
async function callHuggingFace(
  prompt: string,
  language: string,
  retries = 3,
  initialMaxTokens = 800,
  maxCapTokens = 8000
): Promise<string> {
  let attempt = 0;

  while (attempt < retries) {
    attempt++;
    let max_tokens = initialMaxTokens;

    while (max_tokens <= maxCapTokens) {
      try {
        console.log(`[HF] Attempt ${attempt}/${retries} — max_tokens=${max_tokens}`);
        const resp = await fetch(HF_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: [
              { role: "system", content: `You are a coding assistant. Write valid ${language} code.` },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens,
            top_p: 1.0,
          }),
        });

        // model loading
        if (resp.status === 503) {
          const j = await resp.json().catch(() => ({}));
          const wait = j?.estimated_time ?? 10;
          console.log(`[HF] Model loading; waiting ${wait}s`);
          await new Promise((r) => setTimeout(r, wait * 1000));
          continue;
        }

        if (!resp.ok) {
          const text = await resp.text().catch(() => "<no-body>");
          console.error(`[HF] HTTP ${resp.status}: ${text}`);
          // resource gone/not found -> no point retrying
          if (resp.status === 410 || resp.status === 404) return "";
          // other 4xx/5xx we break to outer retry
          break;
        }

        const data = await resp.json().catch(() => ({}));
        const choice = data?.choices?.[0];
        const content = choice?.message?.content?.trim() ?? "";
        const finish = choice?.finish_reason ?? null;
        console.log(`[HF] finish_reason=${finish}`);

        // truncated: increase token budget if possible and retry
        if (finish === "length" && max_tokens < maxCapTokens) {
          max_tokens = Math.min(max_tokens * 2, maxCapTokens);
          console.log(`[HF] Response truncated. Increasing max_tokens -> ${max_tokens} and retrying.`);
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        return content;
      } catch (err) {
        console.error(`[HF] network error on attempt ${attempt}:`, err);
        // jittered backoff
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        break;
      }
    }

    // short pause before next attempt
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }

  return "";
}

/** Helpers to return standard JSON responses */
function jsonOk(data: any) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}
function jsonErr(message: string, status = 500) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

/** POST handler */
export async function POST(request: Request) {
  try {
    // 1) Authenticate via Clerk
    const { userId } = await auth();// server-side Clerk auth
    if (!userId) {
      // Allow an explicit anonymous fallback only if environment variable permits it.
      const allowAnon = process.env.ALLOW_ANON?.toLowerCase() === "true";
      if (!allowAnon) {
        return jsonErr("Unauthorized: sign in required", 401);
      }
    }

    // 2) Validate input
    const body = await request.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = parsed.error.issues?.[0];
      const message = firstErr ? `${firstErr.path.join(".")}: ${firstErr.message}` : "Invalid input";
      return jsonErr(message, 400);
    }
    const { prompt, language } = parsed.data;

    console.log(`[Backend] Generating ${language} code... (prompt length: ${prompt.length})`);

    // 3) Call HF (or other model)
    const generatedCodeRaw = await callHuggingFace(prompt, language);
    let generatedCode = generatedCodeRaw;

    if (!generatedCode) {
      console.warn("[Backend] HF returned empty result; using fallback message");
      generatedCode = `// [ERROR] API failed. Here is a fallback.\n// Prompt: ${prompt}\n\n// TODO: Check server logs for HTTP errors.\n`;
    } else {
      console.log("[Backend] Code generated successfully");
    }

    // 4) Truncate long outputs
    const codeToSave =
      generatedCode.length > MAX_CODE_LENGTH ? generatedCode.slice(0, MAX_CODE_LENGTH) + "\n/* truncated */" : generatedCode;

    // 5) Upsert user row
    let appUser;
    if (userId) {
      appUser = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: { clerkId: userId },
      });
    } else {
      // anonymous fallback: upsert demo user (only when allowed)
      appUser = await prisma.user.upsert({
        where: { username: "demo_user" },
        update: {},
        create: { username: "demo_user", clerkId: `anon_${Date.now()}` },
      });
    }

    // 6) Create generation record
    const record = await prisma.generation.create({
      data: {
        prompt,
        language,
        code: codeToSave,
        userId: appUser.id,
      },
    });

    return jsonOk(record);
  } catch (error: any) {
    console.error("[Backend] Exception in POST /api/generate:", error);

    // network/upstream hints
    const msg = error?.message ?? String(error);
    if (msg.includes("Network") || msg.includes("Upstream") || msg.includes("503")) {
      return jsonErr("Generation service unavailable", 503);
    }

    return jsonErr("Internal server error", 500);
  }
}
