const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters.pollId;
    const body = JSON.parse(event.body);
    const optionIndex = body.optionIndex;

    const getResult = await dynamo.send(
      new GetCommand({
        TableName: "PollsTable_Duha", // الاسم الصحيح
        Key: { pollId: pollId }
      })
    );

    const poll = getResult.Item;
    if (!poll) {
      return { 
        statusCode: 404, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "التصويت غير موجود" }) 
      };
    }

    poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
    poll.totalVotes = (poll.totalVotes || 0) + 1;

    await dynamo.send(
      new PutCommand({
        TableName: "PollsTable_Duha", // التعديل هنا: أضفنا اسمك للجدول
        Item: poll
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // الختم ضروري
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "تم تسجيل تصويتك بنجاح!", updatedPoll: poll }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" }, // الختم في الخطأ
      body: JSON.stringify({ message: "حدث خطأ أثناء تسجيل التصويت" }),
    };
  }
};