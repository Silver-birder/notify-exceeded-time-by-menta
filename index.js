function main() {
    Logger.log(`start: main`);
    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const listSheet = spreadSheet.getSheetByName("list");
    const lastDateRow = listSheet.getRange("B:B").getValues().filter(String).length + 2 - 1; // +2 = ヘッダー行, -1: 最終行の値
    const nowDate = new Date();
    const oneMonthAgo = new Date(nowDate.getFullYear(), nowDate.getMonth()-1, nowDate.getDate());
    const users = getActiveUsers();
    let nowRow = lastDateRow;
    while(true) {
        const InquiryDate = listSheet.getRange(`B${nowRow}`).getValue();
        if (oneMonthAgo > InquiryDate) {
            Logger.log(`main: oneMonthAgo(${oneMonthAgo.toDateString()}) > InquiryDate(${InquiryDate.toDateString()})`);
            break;
        }
        Logger.log(`main: oneMonthAgo(${oneMonthAgo.toDateString()}) <= InquiryDate(${InquiryDate.toDateString()})`);
        const userRow = listSheet.getRange(`D${nowRow}`).getValue();
        const user = users[userRow];
        if (!user) {
            Logger.log(`main: !user(${user})`);
            nowRow -= 1;
            continue;
        }
        Logger.log(`main: user`, userRow);
        const fromDate = user["fromDate"];
        if (fromDate > InquiryDate) {
            Logger.log(`main: fromDate(${fromDate.toDateString()}) > InquiryDate(${InquiryDate.toDateString()})`);
            nowRow -= 1;
            continue;
        }
        Logger.log(`main: fromDate(${fromDate.toDateString()}) <= InquiryDate(${InquiryDate.toDateString()})`);
        const workTime = listSheet.getRange(`F${nowRow}`).getValue();
        users[userRow]["uptime"] += workTime;
        nowRow -= 1;
    }
    Logger.log(`end: main`);
    for (let user in users) {
        if(users[user].maxUptime >= users[user].uptime) {
            continue
        }
        const message = `User(${user}) has exceeded maximum uptime. maxUptime(${users[user].maxUptime}, uptime(${users[user].uptime}))`
        sendSlack(message);
    }
    return users;
}

function sendSlack(message) {
    const payload = {
        attachments: [{
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": message,
                    }
                }
            ]
        }]
    };
    const options =
        {
            "method": "post",
            "contentType": "application/json",
            "payload": JSON.stringify(payload)
        };
    const webHookUrl = ""
    UrlFetchApp.fetch(webHookUrl, options);
}

function getActiveUsers() {
    Logger.log(`start: getActiveUsers`);
    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const menteeSheet = spreadSheet.getSheetByName("mentee");
    const lastUserRow = menteeSheet.getRange("A:A").getValues().filter(String).length;
    const nowDate = new Date();
    const nowDay = nowDate.getDate();
    let nowRow = 2;
    let users = {};
    while(true) {
        if (nowRow > lastUserRow) {
            Logger.log(`getActiveUsers: nowRow(${nowRow}) > lastUserRow(${lastUserRow})`);
            break;
        }
        Logger.log(`getActiveUsers: nowRow(${nowRow}) <= lastUserRow(${lastUserRow})`);
        const user = menteeSheet.getRange(`A${nowRow}`).getValue();
        const active = menteeSheet.getRange(`E${nowRow}`).getValue();
        if (active == false) {
            Logger.log(`getActiveUsers: active(user: ${user}) == false`);
            nowRow += 1;
            continue;
        }
        Logger.log(`getActiveUsers: active(user: ${user}) == true`);
        const maxUptime = menteeSheet.getRange(`D${nowRow}`).getValue();
        const startDay = menteeSheet.getRange(`C${nowRow}`).getValue();
        let fromDate = "";
        const toDate = nowDate;
        if (nowDay >= startDay) {
            Logger.log(`getActiveUsers: nowDay(${nowDay}) >= startDay(${startDay})`);
            fromDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), startDay);
        } else {
            Logger.log(`getActiveUsers: nowDay(${nowDay}) < startDay(${startDay})`);
            fromDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, startDay);
        }
        users[user] = {'fromDate': fromDate, 'toDate': toDate, 'maxUptime': maxUptime, 'uptime': 0}
        Logger.log("getActiveUsers: user", users[user]);
        nowRow++;
    }
    Logger.log(`end: getActiveUsers`);
    return users;
}
