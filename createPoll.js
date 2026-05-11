// 1. استخدمنا أداة نود المدمجة بدلاً من المكتبة الخارجية
const crypto = require('crypto');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    // 2. توليد رقم فريد باستخدام randomUUID
    const pollId = crypto.randomUUID();
    const body = JSON.parse(event.body);

    const newPoll = {
      pollId: pollId,
      question: body.question,
      options: body.options,
      email: body.email,
      totalVotes: 0 
    };

    await dynamo.send(
      new PutCommand({
        TableName: "PollsTable_Duha",
        Item: newPoll
      })
    );

   return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // هذا هو الختم السحري اللي بيحل المشكلة!
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Poll created successfully!",
        pollId: pollId,
      }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "حدث خطأ في السيرفر" }),
    };
  }
};