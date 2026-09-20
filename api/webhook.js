const BOT_TOKEN = process.env.BOT_TOKEN;

const CHANNEL_ID =
  process.env.CHANNEL_ID ||
  "-1002308592775";

const CHANNEL_LINK =
  "https://t.me/+gWC65VFnQN43NGU1";

const VIDEO_FILE_ID =
  process.env.VIDEO_FILE_ID || "";

const APK_FILE_ID =
  process.env.APK_FILE_ID || "";

const VOICE_FILE_ID =
  process.env.VOICE_FILE_ID || "";

const MESSAGE_TEXT =
  process.env.MESSAGE_TEXT ||
  "🎉 Welcome!\n\nThank you for joining our channel.";


// ==========================================
// TELEGRAM API
// ==========================================

async function telegram(method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  console.log(
    `Telegram ${method}:`,
    JSON.stringify(data)
  );

  return data;
}


// ==========================================
// SEND WELCOME + LINK + FILES
// ==========================================

async function sendWelcome(chatId) {
  console.log(
    "Sending welcome to:",
    chatId
  );

  // Welcome message + channel link
  await telegram("sendMessage", {
    chat_id: chatId,

    text:
      MESSAGE_TEXT +
      "\n\n📢 Main Channel:\n" +
      CHANNEL_LINK,

    disable_web_page_preview: false,
  });


  // VIDEO
  if (VIDEO_FILE_ID) {
    console.log("Sending video...");

    await telegram("sendVideo", {
      chat_id: chatId,
      video: VIDEO_FILE_ID,
    });
  }


  // VOICE
  if (VOICE_FILE_ID) {
    console.log("Sending voice...");

    await telegram("sendVoice", {
      chat_id: chatId,
      voice: VOICE_FILE_ID,
    });
  }


  // APK
  if (APK_FILE_ID) {
    console.log("Sending APK...");

    await telegram("sendDocument", {
      chat_id: chatId,
      document: APK_FILE_ID,
      caption: "📦 APK File",
    });
  }

  console.log(
    "All welcome content sent."
  );
}


// ==========================================
// CHECK MEMBERSHIP
// ==========================================

async function checkMembership(userId) {
  return await telegram(
    "getChatMember",
    {
      chat_id: CHANNEL_ID,
      user_id: userId,
    }
  );
}


// ==========================================
// HANDLE /START
// ==========================================

async function handleStart(
  chatId,
  userId
) {
  console.log(
    "Checking membership:",
    userId
  );

  const membership =
    await checkMembership(userId);

  console.log(
    "Membership result:",
    JSON.stringify(membership)
  );


  // Membership API failed
  if (!membership.ok) {
    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          "⚠️ Membership check failed.\n\n" +
          "Please try again.",
      }
    );

    return;
  }


  const status =
    membership.result.status;

  console.log(
    "User status:",
    status
  );


  const joined =
    status === "member" ||
    status === "administrator" ||
    status === "creator";


  // ========================================
  // NOT JOINED
  // ========================================

  if (!joined) {
    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          "👋 Welcome!\n\n" +

          "1️⃣ Join our main channel:\n" +
          CHANNEL_LINK +

          "\n\n" +

          "2️⃣ Wait until your join request is approved." +

          "\n\n" +

          "3️⃣ After approval, send /start again.",

        disable_web_page_preview: false,
      }
    );

    return;
  }


  // ========================================
  // ALREADY JOINED
  // ========================================

  await sendWelcome(chatId);
}


// ==========================================
// VERCEL WEBHOOK
// ==========================================

export default async function handler(
  req,
  res
) {

  // GET request
  if (req.method !== "POST") {
    return res
      .status(200)
      .send(
        "Telegram bot is running ✅"
      );
  }


  // BOT TOKEN CHECK
  if (!BOT_TOKEN) {
    return res
      .status(500)
      .send(
        "BOT_TOKEN is missing"
      );
  }


  // CHANNEL ID CHECK
  if (!CHANNEL_ID) {
    return res
      .status(500)
      .send(
        "CHANNEL_ID is missing"
      );
  }


  try {

    const update =
      req.body || {};

    console.log(
      "Telegram update:",
      JSON.stringify(update)
    );


    // ========================================
    // /START
    // ========================================

    if (
      update.message?.text?.startsWith(
        "/start"
      )
    ) {

      const chatId =
        update.message.chat.id;

      const userId =
        update.message.from.id;


      await handleStart(
        chatId,
        userId
      );
    }


    // ========================================
    // CHANNEL MEMBER UPDATE
    // ========================================

    if (
      update.chat_member &&
      update.chat_member.chat &&
      update.chat_member.new_chat_member
    ) {

      const memberUpdate =
        update.chat_member;


      const joinedUser =
        memberUpdate
          .new_chat_member
          .user;


      const newStatus =
        memberUpdate
          .new_chat_member
          .status;


      const oldStatus =
        memberUpdate
          .old_chat_member?.status;


      console.log(
        "Channel ID:",
        memberUpdate.chat.id
      );

      console.log(
        "Old status:",
        oldStatus
      );

      console.log(
        "New status:",
        newStatus
      );


      const isOurChannel =
        String(
          memberUpdate.chat.id
        ) ===
        String(CHANNEL_ID);


      const memberStatuses = [
        "member",
        "administrator",
        "creator",
      ];


      const becameMember =
        isOurChannel &&
        memberStatuses.includes(
          newStatus
        ) &&
        !memberStatuses.includes(
          oldStatus
        );


      if (
        becameMember &&
        joinedUser &&
        !joinedUser.is_bot
      ) {

        console.log(
          "NEW APPROVED MEMBER:",
          joinedUser.id
        );


        await sendWelcome(
          joinedUser.id
        );
      }
    }


    return res
      .status(200)
      .send("OK");

  } catch (error) {

    console.error(
      "Webhook error:",
      error
    );

    return res
      .status(500)
      .send(
        "Webhook error"
      );
  }
}
