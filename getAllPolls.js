const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    // نستخدم أمر Scan لمسح الجدول بالكامل وجلب كل العناصر
    const result = await dynamo.send(
      new ScanCommand({
        TableName: "PollsTable_Duha"
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      // ScanCommand يُرجع مصفوفة اسمها Items (بحرف الـ s)
      body: JSON.stringify(result.Items), 
    };

  } catch (error) {
    console.error("خطأ في جلب التصويتات:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "حدث خطأ أثناء جلب جميع التصويتات" }),
    };
  }
};