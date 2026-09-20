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

const MESSAGE_TEXT =
  process.env.MESSAGE_TEXT ||
  "🎉 Welcome!\n\nThank you for joining our channel.";


// ==========================================
// TELEGRAM API
// ==========================================

async function telegram(method, body) {
  if (!BOT_TOKEN) {
    console.error("BOT_TOKEN is missing");
    return {
      ok: false,
      description: "BOT_TOKEN is missing",
    };
  }

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
// SEND WELCOME + VIDEO + VOICE
// ==========================================

async function sendWelcome(chatId) {
  console.log(
    "Sending welcome to:",
    chatId
  );

  // Welcome message
  const messageResult = await telegram(
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

  console.log(
    "Welcome message result:",
    JSON.stringify(messageResult)
  );


  // VIDEO
  if (VIDEO_FILE_ID) {
    console.log("Sending video...");

    const videoResult = await telegram(
      "sendVideo",
      {
        chat_id: chatId,
        video: VIDEO_FILE_ID,
      }
    );

    console.log(
      "Video result:",
      JSON.stringify(videoResult)
    );
  } else {
    console.log(
      "VIDEO_FILE_ID is missing"
    );
  }


  // VOICE
  if (VOICE_FILE_ID) {
    console.log("Sending voice...");

    const voiceResult = await telegram(
      "sendVoice",
      {
        chat_id: chatId,
        voice: VOICE_FILE_ID,
      }
    );

    console.log(
      "Voice result:",
      JSON.stringify(voiceResult)
    );
  } else {
    console.log(
      "VOICE_FILE_ID is missing"
    );
  }

  console.log(
    "Welcome content completed for:",
    chatId
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
    "Checking membership for:",
    userId
  );

  const membership =
    await checkMembership(userId);

  console.log(
    "Membership result:",
    JSON.stringify(membership)
  );


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
          "2️⃣ Wait until your join request is approved.\n\n" +
          "3️⃣ After approval, send /start again.",

        disable_web_page_preview: false,
      }
    );

    return;
  }


  // ========================================
  // ALREADY JOINED
  // ========================================

  console.log(
    "User already joined:",
    userId
  );

  await sendWelcome(chatId);
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
  // ENV CHECK
  // ========================================

  if (!BOT_TOKEN) {
    return res
      .status(500)
      .send(
        "BOT_TOKEN is missing"
      );
  }

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

      console.log(
        "/start received from:",
        userId
      );

      await handleStart(
        chatId,
        userId
      );
    }


    // ========================================
    // CHANNEL JOIN REQUEST
    // ========================================

    if (update.chat_join_request) {

      const request =
        update.chat_join_request;

      const requestChat =
        request.chat;

      const user =
        request.from;

      console.log(
        "JOIN REQUEST:",
        JSON.stringify(request)
      );


      const isOurChannel =
        requestChat &&
        String(requestChat.id) ===
        String(CHANNEL_ID);


      if (
        isOurChannel &&
        user &&
        !user.is_bot
      ) {

        console.log(
          "NEW JOIN REQUEST FROM:",
          user.id
        );


        // Approve request
        const approved =
          await telegram(
            "approveChatJoinRequest",
            {
              chat_id: CHANNEL_ID,
              user_id: user.id,
            }
          );


        console.log(
          "Join request approval:",
          JSON.stringify(approved)
        );


        if (approved.ok) {

          console.log(
            "JOIN REQUEST APPROVED:",
            user.id
          );


          // Tell user to open bot
          await telegram(
            "sendMessage",
            {
              chat_id: user.id,

              text:
                "✅ Your channel join request has been approved!\n\n" +
                "Please send /start here to receive the available setup content.",
            }
          );

        } else {

          console.error(
            "Could not approve join request:",
            JSON.stringify(approved)
          );

        }
      }
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


        // This only works if the user
        // has already opened the bot.
        await sendWelcome(
          joinedUser.id
        );
      }
    }


    // ========================================
    // SUCCESS
    // ========================================

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
