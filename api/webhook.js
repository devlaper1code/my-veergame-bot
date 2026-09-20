const BOT_TOKEN = process.env.BOT_TOKEN;

const CHANNEL_ID =
  process.env.CHANNEL_ID ||
  "-1002308592775";

const CHANNEL_LINK =
  process.env.CHANNEL_LINK ||
  "https://t.me/+gWC65VFnQN43NGU1";

const VIDEO_FILE_ID =
  process.env.VIDEO_FILE_ID || "";

const VOICE_FILE_ID =
  process.env.VOICE_FILE_ID || "";

const APK_FILE_ID =
  process.env.APK_FILE_ID || "";

const MESSAGE_TEXT =
  process.env.MESSAGE_TEXT ||
  "🎉 Welcome!\n\nThank you for joining our channel.";

const APK_CAPTION =
  process.env.APK_CAPTION ||
  "📦 APK File";


// ==========================================
// TELEGRAM API
// ==========================================

async function telegram(method, body) {
  if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN is missing");

    return {
      ok: false,
      description: "BOT_TOKEN is missing",
    };
  }

  try {
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

  } catch (error) {

    console.error(
      `Telegram ${method} error:`,
      error
    );

    return {
      ok: false,
      description: error.message,
    };
  }
}


// ==========================================
// SEND WELCOME CONTENT
// ==========================================

async function sendWelcome(chatId) {

  console.log(
    "📤 Sending welcome content to:",
    chatId
  );


  // ========================================
  // WELCOME MESSAGE
  // ========================================

  const messageResult =
    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          MESSAGE_TEXT +
          "\n\n📢 Main Channel:\n" +
          CHANNEL_LINK,

        disable_web_page_preview: false,
      }
    );


  if (!messageResult.ok) {

    console.error(
      "❌ Welcome message failed:",
      JSON.stringify(messageResult)
    );

  } else {

    console.log(
      "✅ Welcome message sent"
    );
  }


  // ========================================
  // VIDEO
  // ========================================

  if (VIDEO_FILE_ID) {

    console.log(
      "🎥 Sending video..."
    );

    const videoResult =
      await telegram(
        "sendVideo",
        {
          chat_id: chatId,

          video: VIDEO_FILE_ID,
        }
      );


    if (!videoResult.ok) {

      console.error(
        "❌ Video failed:",
        JSON.stringify(videoResult)
      );

    } else {

      console.log(
        "✅ Video sent"
      );
    }

  } else {

    console.log(
      "⚠️ VIDEO_FILE_ID is empty"
    );
  }


  // ========================================
  // VOICE
  // ========================================

  if (VOICE_FILE_ID) {

    console.log(
      "🎤 Sending voice..."
    );

    const voiceResult =
      await telegram(
        "sendVoice",
        {
          chat_id: chatId,

          voice: VOICE_FILE_ID,
        }
      );


    if (!voiceResult.ok) {

      console.error(
        "❌ Voice failed:",
        JSON.stringify(voiceResult)
      );

    } else {

      console.log(
        "✅ Voice sent"
      );
    }

  } else {

    console.log(
      "⚠️ VOICE_FILE_ID is empty"
    );
  }


  // ========================================
  // APK
  // ========================================

  if (APK_FILE_ID) {

    console.log(
      "📦 Sending APK..."
    );

    const apkResult =
      await telegram(
        "sendDocument",
        {
          chat_id: chatId,

          document: APK_FILE_ID,

          caption: APK_CAPTION,
        }
      );


    if (!apkResult.ok) {

      console.error(
        "❌ APK failed:",
        JSON.stringify(apkResult)
      );

    } else {

      console.log(
        "✅ APK sent"
      );
    }

  } else {

    console.log(
      "⚠️ APK_FILE_ID is empty"
    );
  }


  console.log(
    "✅ Welcome process completed:",
    chatId
  );
}


// ==========================================
// CHECK MEMBERSHIP
// ==========================================

async function checkMembership(userId) {

  console.log(
    "🔍 Checking membership:",
    userId
  );

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
    "🚀 /start received"
  );

  console.log(
    "User ID:",
    userId
  );

  console.log(
    "Chat ID:",
    chatId
  );


  const membership =
    await checkMembership(userId);


  console.log(
    "Membership result:",
    JSON.stringify(membership)
  );


  // ========================================
  // MEMBERSHIP API ERROR
  // ========================================

  if (!membership.ok) {

    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          "⚠️ Membership check failed.\n\n" +
          "Please try /start again.",
      }
    );

    return;
  }


  const status =
    membership.result.status;


  console.log(
    "👤 User status:",
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

    console.log(
      "❌ User has not joined channel"
    );


    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          "👋 Welcome!\n\n" +

          "📢 First join our channel:\n" +
          CHANNEL_LINK +

          "\n\n" +

          "✅ After joining, send /start again.",
      }
    );

    return;
  }


  // ========================================
  // JOINED
  // ========================================

  console.log(
    "✅ User is a channel member"
  );


  await sendWelcome(chatId);
}


// ==========================================
// HANDLE JOIN REQUEST
// ==========================================

async function handleJoinRequest(
  request
) {

  const requestChat =
    request.chat;

  const user =
    request.from;


  console.log(
    "📥 JOIN REQUEST:",
    JSON.stringify(request)
  );


  if (!requestChat || !user) {

    console.log(
      "⚠️ Invalid join request"
    );

    return;
  }


  const isOurChannel =
    String(requestChat.id) ===
    String(CHANNEL_ID);


  if (!isOurChannel) {

    console.log(
      "⚠️ Join request is for another channel"
    );

    return;
  }


  if (user.is_bot) {

    console.log(
      "⚠️ Ignoring bot user"
    );

    return;
  }


  console.log(
    "👤 New join request:",
    user.id
  );


  // ========================================
  // APPROVE
  // ========================================

  const approved =
    await telegram(
      "approveChatJoinRequest",
      {
        chat_id: CHANNEL_ID,

        user_id: user.id,
      }
    );


  console.log(
    "Approval result:",
    JSON.stringify(approved)
  );


  if (!approved.ok) {

    console.error(
      "❌ Could not approve user:",
      JSON.stringify(approved)
    );

    return;
  }


  console.log(
    "✅ JOIN REQUEST APPROVED:",
    user.id
  );


  // ========================================
  // TELL USER TO START
  // ========================================

  const notify =
    await telegram(
      "sendMessage",
      {
        chat_id: user.id,

        text:
          "✅ Your channel join request has been approved!\n\n" +
          "Send /start here to receive your content.",
      }
    );


  console.log(
    "Approval notification:",
    JSON.stringify(notify)
  );
}


// ==========================================
// HANDLE CHANNEL MEMBER UPDATE
// ==========================================

async function handleChatMember(
  memberUpdate
) {

  console.log(
    "👥 CHAT MEMBER UPDATE:",
    JSON.stringify(memberUpdate)
  );


  const channel =
    memberUpdate.chat;

  const newMember =
    memberUpdate.new_chat_member;

  const oldMember =
    memberUpdate.old_chat_member;


  if (!channel || !newMember) {
    return;
  }


  const joinedUser =
    newMember.user;


  if (!joinedUser) {
    return;
  }


  if (joinedUser.is_bot) {
    return;
  }


  const newStatus =
    newMember.status;

  const oldStatus =
    oldMember?.status;


  console.log(
    "Channel:",
    channel.id
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
    String(channel.id) ===
    String(CHANNEL_ID);


  if (!isOurChannel) {
    return;
  }


  const memberStatuses = [
    "member",
    "administrator",
    "creator",
  ];


  const becameMember =
    memberStatuses.includes(newStatus) &&
    !memberStatuses.includes(oldStatus);


  if (!becameMember) {
    return;
  }


  console.log(
    "🎉 NEW APPROVED MEMBER:",
    joinedUser.id
  );


  /*
   * IMPORTANT:
   *
   * We don't automatically send the
   * welcome files here because the user
   * may not have started the bot chat.
   *
   * The user sends /start and then
   * membership is checked.
   */
}


// ==========================================
// VERCEL WEBHOOK
// ==========================================

export default async function handler(
  req,
  res
) {

  // ========================================
  // GET
  // ========================================

  if (req.method !== "POST") {

    return res
      .status(200)
      .send(
        "Telegram bot is running ✅"
      );
  }


  // ========================================
  // BOT TOKEN CHECK
  // ========================================

  if (!BOT_TOKEN) {

    return res
      .status(500)
      .send(
        "BOT_TOKEN is missing"
      );
  }


  // ========================================
  // CHANNEL CHECK
  // ========================================

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
      "================================"
    );

    console.log(
      "📩 TELEGRAM UPDATE"
    );

    console.log(
      JSON.stringify(update)
    );

    console.log(
      "================================"
    );


    // ======================================
    // NORMAL MESSAGE
    // ======================================

    if (update.message) {

      const message =
        update.message;


      const chatId =
        message.chat?.id;


      const userId =
        message.from?.id;


      const text =
        message.text || "";


      console.log(
        "💬 MESSAGE:",
        text
      );


      if (
        chatId &&
        userId &&
        text.startsWith("/start")
      ) {

        await handleStart(
          chatId,
          userId
        );
      }
    }


    // ======================================
    // JOIN REQUEST
    // ======================================

    if (update.chat_join_request) {

      await handleJoinRequest(
        update.chat_join_request
      );
    }


    // ======================================
    // CHAT MEMBER
    // ======================================

    if (update.chat_member) {

      await handleChatMember(
        update.chat_member
      );
    }


    // ======================================
    // ALWAYS RETURN 200
    // ======================================

    return res
      .status(200)
      .send("OK");


  } catch (error) {

    console.error(
      "❌ WEBHOOK ERROR:",
      error
    );


    return res
      .status(200)
      .send("OK");
  }
}
