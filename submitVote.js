const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
// 1. نسحب الـ ID من الرابط، ونسحب رقم الخيار اللي تم التصويت له من الجسم (body) اللي أرسلته الواجهة
    const pollId = event.pathParameters.pollId;
    const body = JSON.parse(event.body);
    const optionIndex = body.optionIndex; // رقم الخيار (0, 1, 2...)

  // 2. نجيب التصويت من قاعدة البيانات عشان نعدل عليه
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

    // 3. نزيد العدادات! (نزيد صوت للخيار المختار، ونزيد المجموع الكلي)

    poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
    poll.totalVotes = (poll.totalVotes || 0) + 1;

    // 4. نحفظ التصويت بالتحديثات الجديدة في قاعدة البيانات
    await dynamo.send(
      new PutCommand({
        TableName: "PollsTable",
        Item: poll
      })
    );

    // 5. نرد للواجهة بالنجاح
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "تم تسجيل تصويتك بنجاح!", updatedPoll: poll }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "حدث خطأ أثناء تسجيل التصويت" }),
    };
  }
};