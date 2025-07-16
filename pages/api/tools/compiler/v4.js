import {
  WebSocket
} from "ws";
import axios from "axios";
const jsCode = `
console.log("Hello from JavaScript!");
let a = 5;
let b = 15;
console.log("Product: " + (a * b));
`;
class Compiler {
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  generateSessionId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({
      length: 10
    }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  }
  async compile({
    code = jsCode,
    lang = "javascript"
  }) {
    return new Promise(async (resolve, reject) => {
      try {
        await axios.post("https://compiler-api.programiz.com/api/v1/code", {
          user_id: this.generateUUID(),
          session_id: this.generateUUID(),
          code: code,
          user_agent: "Mozilla/5.0",
          language: lang
        });
        const sessionId = this.generateSessionId();
        const wsUrl = `wss://${lang}.repl-web.programiz.com/socket.io/?sessionId=${sessionId}&lang=${lang}&EIO=3&transport=websocket`;
        const ws = new WebSocket(wsUrl);
        let result = "";
        ws.on("open", () => {});
        ws.on("message", message => {
          message = message.toString();
          if (message.startsWith("40")) {
            ws.send(`42["run",${JSON.stringify({
code: code
})}]`);
          } else if (message.startsWith('42["output"')) {
            try {
              const [, payload] = JSON.parse(message.substring(2));
              if (payload?.output) result += payload.output;
            } catch (e) {
              console.error("Error parsing output:", e.message);
            }
          } else if (message === "41") {
            ws.close();
          }
        });
        ws.on("close", () => resolve(result.trim()));
        ws.on("error", err => reject(err.message));
      } catch (err) {
        reject("Request error: " + err.message);
      }
    });
  }
}
export default async function handler(req, res) {
  const params = req.method === "GET" ? req.query : req.body;
  const myCompiler = new Compiler();
  try {
    const data = await myCompiler.compile(params);
    return res.status(200).json({
      result: data
    });
  } catch (error) {
    res.status(500).json({
      error: "Error during chat request"
    });
  }
}