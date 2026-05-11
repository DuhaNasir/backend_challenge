const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});// تجهيز "الموظف" الذي سيوصل البيانات إلى أمازون
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    // 1. نسحب الـ ID من الرابط (تتذكرين الأقواس المتعرجة {pollId}؟ من هنا نمسكها!)
    const pollId = event.pathParameters.pollId;

    // 2. أمر البحث في قاعدة البيانات (نستخدم GetCommand بدلاً من PutCommand)
    const result = await dynamo.send(
      new GetCommand({
        TableName: "PollsTable_Duha",
        Key: {
          pollId: pollId // نبحث عن التصويت اللي يطابق هذا الـ ID
        }
      })
    );

    // 3. نتأكد هل التصويت موجود أصلاً؟
    if (!result.Item) {
      return {
        statusCode: 404, // 404 تعني (غير موجود - Not Found)
        body: JSON.stringify({ message: "عذراً، هذا التصويت غير موجود" }),
      };
    }

    // 4. إذا لقيناه، نرد ونرسل البيانات للواجهة
  return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // هذا الختم ضروري جداً!
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(result.Item), // أو حسب اسم المتغير عندك اللي يرجع البيانات
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "حدث خطأ أثناء جلب البيانات" }),
    };
  }
};