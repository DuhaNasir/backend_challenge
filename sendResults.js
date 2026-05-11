const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const nodemailer = require("nodemailer");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters.pollId;

    const getResult = await dynamo.send(
      new GetCommand({
        TableName: "PollsTable_Duha",
        Key: { pollId: pollId }
      })
    );

    const poll = getResult.Item;
    if (!poll) {
      return { statusCode: 404, body: JSON.stringify({ message: "التصويت غير موجود" }) };
    }

    // تجهيز نص النتائج
    const resultsSummary = poll.options
      .map(opt => `${opt.text}: ${opt.votes || 0} أصوات`)
      .join('\n');

    const emailText = `
    مرحباً! إليك نتائج التصويت الخاص بك:
    
    السؤال: ${poll.question}
    النتائج:
    ${resultsSummary}
    
    إجمالي الأصوات: ${poll.totalVotes || 0}
    `;

    // إعداد "السيرفر" المرسل باستخدام متغيرات البيئة للأمان
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"نظام التصويت الذكي" <${process.env.EMAIL_USER}>`,
      to: poll.email, // الإيميل الذي حفظناه عند إنشاء التصويت
      subject: `نتائج التصويت النهائية: ${poll.question}`,
      text: emailText
    });

   return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // هذا الختم ضروري!
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "تم الإرسال بنجاح" }),
    };

  } catch (error) {
    console.error("تفاصيل الخطأ السري:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // الختم هنا كمان!
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "فشل إرسال الإيميل" }),
    };
  }
};