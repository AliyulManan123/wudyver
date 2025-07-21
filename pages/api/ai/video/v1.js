import axios from "axios";
import CryptoJS from "crypto-js";
import apiConfig from "@/configs/apiConfig";
class DigenClient {
  constructor(options = {}) {
    this.baseUrl = "https://api.digen.ai/v1";
    this.mailApiUrl = "https://wudysoft.xyz/api/mails/v9";
    this.videoApiUrl = "https://api.digen.ai/v3/video";
    this.key = CryptoJS.enc.Utf8.parse(apiConfig.PASSWORD.padEnd(32, "x"));
    this.iv = CryptoJS.enc.Utf8.parse(apiConfig.PASSWORD.padEnd(16, "x"));
    this.defaultPassword = this.generateRandomPassword(12);
    this.defaultName = "";
    this.defaultLanguage = "id-ID";
    this.defaultPlatform = "web";
    this.defaultUserAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36";
    this.origin = "https://rm.digen.ai";
    this.referer = "https://rm.digen.ai/";
    this.email = null;
    this.token = null;
    this.sessionId = this.generateUUID();
    this.userId = null;
    this.registerToken = null;
    this.lastOTP = null;
    this.spoofIp = this.generateRandomIp();
    this.axiosInstance = axios.create({
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": this.defaultLanguage,
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        "sec-ch-ua": '"Lemur";v="135", "", "", "Microsoft Edge Simulate";v="135"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": this.defaultUserAgent,
        "digen-language": this.defaultLanguage,
        "digen-platform": this.defaultPlatform,
        origin: this.origin,
        referer: this.referer
      }
    });
    this.axiosInstance.interceptors.request.use(config => {
      config.headers["X-Forwarded-For"] = this.generateRandomIp();
      config.headers["digen-token"] = this.token || "";
      config.headers["digen-sessionid"] = this.sessionId || this.generateUUID();
      return config;
    }, error => {
      return Promise.reject(error);
    });
    Object.assign(this, options);
  }
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  generateRandomIp() {
    const octet = () => Math.floor(Math.random() * 255) + 1;
    return `${octet()}.${octet()}.${octet()}.${octet()}`;
  }
  generateRandomPassword(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  async createEmail() {
    try {
      console.log("LOG: Creating temporary email...");
      const response = await axios.get(`${this.mailApiUrl}?action=create`, {
        headers: {
          accept: "application/json",
          "X-Forwarded-For": this.generateRandomIp()
        }
      });
      const data = response.data;
      if (!data || !data.email) {
        throw new Error(`Failed to create email: No email received in response. Response: ${JSON.stringify(data)}`);
      }
      this.email = data.email;
      console.log(`LOG: Email created: ${this.email}`);
      return this.email;
    } catch (error) {
      console.error(`ERROR: Failed to create email: ${error.message}`);
      throw error;
    }
  }
  async checkOTP(maxRetries = 20, delay = 3e3) {
    console.log("LOG: Waiting for OTP...");
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(`${this.mailApiUrl}?action=message&email=${this.email}`, {
          headers: {
            accept: "application/json",
            "X-Forwarded-For": this.generateRandomIp()
          }
        });
        const data = response.data;
        if (data && data.data && data.data.length > 0) {
          const textContent = data.data[0].text_content;
          const otpMatch = textContent.match(/Verification code: (\d+)/);
          if (otpMatch) {
            this.lastOTP = otpMatch[1];
            console.log(`LOG: OTP received: ${this.lastOTP}`);
            return this.lastOTP;
          }
        }
      } catch (error) {
        console.warn(`LOG: OTP check attempt ${i + 1} failed: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error("Failed to retrieve OTP after maximum retries");
  }
  async sendVerificationCode() {
    this.sessionId = this.generateUUID();
    try {
      console.log("LOG: Sending verification code...");
      const response = await this.axiosInstance.post(`${this.baseUrl}/user/send_code`, {
        email: this.email
      });
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Send code failed: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      console.log("LOG: Verification code sent successfully.");
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to send verification code: ${error.message}`);
      throw error;
    }
  }
  async verifyCode(code) {
    this.sessionId = this.generateUUID();
    try {
      console.log("LOG: Verifying code...");
      const response = await this.axiosInstance.post(`${this.baseUrl}/user/verify_code`, {
        email: this.email,
        code: code
      });
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Verify code failed: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      this.registerToken = data.data.register_token;
      console.log("LOG: Code verified successfully.");
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to verify code: ${error.message}`);
      throw error;
    }
  }
  async register(password = null, name = null) {
    this.sessionId = this.generateUUID();
    const finalPassword = password || this.defaultPassword;
    const finalName = name || this.defaultName;
    try {
      console.log("LOG: Registering user...");
      const response = await this.axiosInstance.post(`${this.baseUrl}/user/register`, {
        email: this.email,
        register_token: this.registerToken,
        name: finalName,
        password: finalPassword,
        password2: finalPassword,
        code: this.lastOTP,
        invite_code: null
      });
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Register failed: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      this.token = data.data.token;
      this.userId = data.data.id;
      console.log("LOG: Registration successful.");
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to register: ${error.message}`);
      throw error;
    }
  }
  async getLoginReward() {
    this.sessionId = this.generateUUID();
    try {
      console.log("LOG: Getting login reward...");
      const response = await this.axiosInstance.post(`${this.baseUrl}/credit/reward?action=Login`, null, {
        headers: {
          "content-length": "0"
        }
      });
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Get login reward failed: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      console.log("LOG: Login reward claimed.");
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to get login reward: ${error.message}`);
      throw error;
    }
  }
  async authenticate() {
    console.log("LOG: Starting authentication process...");
    try {
      await this.createEmail();
      await this.sendVerificationCode();
      this.lastOTP = await this.checkOTP();
      if (!this.lastOTP) {
        throw new Error("OTP not received, cannot proceed with verification.");
      }
      await this.verifyCode(this.lastOTP);
      if (!this.registerToken) {
        throw new Error("Register token not obtained after verification.");
      }
      await this.register();
      if (!this.token) {
        throw new Error("Authentication token not obtained after registration.");
      }
      await this.getLoginReward();
      console.log("LOG: Authentication completed successfully!");
      return {
        email: this.email,
        token: this.token,
        userId: this.userId,
        sessionId: this.sessionId
      };
    } catch (error) {
      console.error("ERROR: Authentication process error:", error.message);
      throw error;
    }
  }
  async getPresignedUploadUrl(format = "jpeg") {
    this.sessionId = this.generateUUID();
    try {
      console.log(`LOG: Getting presigned URL for format: ${format}...`);
      const response = await this.axiosInstance.get(`${this.baseUrl}/element/priv/presign?format=${format}`);
      const data = response.data;
      if (!data || data.errCode !== 0 || !data.data || !data.data.url) {
        throw new Error(`Presign failed: ${data ? data.errMsg : "No data received or invalid format."} Response: ${JSON.stringify(data)}`);
      }
      console.log("LOG: Presigned URL obtained.");
      return data.data.url;
    } catch (error) {
      console.error(`ERROR: Failed to get presigned upload URL: ${error.message}`);
      throw error;
    }
  }
  async uploadImageToS3(uploadUrl, imageData, contentType) {
    try {
      console.log(`LOG: Uploading image to S3 with content type: ${contentType}...`);
      await axios.put(uploadUrl, imageData, {
        headers: {
          "Content-Type": contentType,
          Accept: "application/json, text/plain, */*",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
          Origin: this.origin,
          Pragma: "no-cache",
          Referer: this.referer,
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site",
          "User-Agent": this.defaultUserAgent,
          "X-Forwarded-For": this.generateRandomIp()
        }
      });
      console.log("LOG: Image uploaded to S3.");
    } catch (error) {
      console.error(`ERROR: Failed to upload image to S3: ${error.message}`);
      throw error;
    }
  }
  async syncImage(url, fileName, thumbnail = null) {
    this.sessionId = this.generateUUID();
    try {
      console.log(`LOG: Syncing image with Digen AI: ${fileName}...`);
      const response = await this.axiosInstance.post(`${this.baseUrl}/element/priv/sync`, {
        url: url,
        thumbnail: thumbnail || url,
        fileName: fileName
      });
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Sync image failed: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      console.log("LOG: Image synced successfully.");
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to sync image: ${error.message}`);
      throw error;
    }
  }
  async uploadImage(imageUrl, fileName = null, contentType = null) {
    try {
      console.log(`LOG: Downloading image from URL: ${imageUrl}...`);
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });
      const imageData = Buffer.from(imageResponse.data);
      const detectedContentType = imageResponse.headers["content-type"] || contentType;
      if (!detectedContentType) {
        throw new Error("Could not determine content type of the image from URL. Please provide it manually.");
      }
      console.log(`LOG: Detected content type: ${detectedContentType}`);
      const format = detectedContentType.split("/")[1];
      if (!format) {
        throw new Error("Could not determine image format from content type.");
      }
      console.log(`LOG: Detected format: ${format}`);
      const finalFileName = fileName || `uploaded_image.${format}`;
      console.log(`LOG: Using filename: ${finalFileName}`);
      const uploadUrl = await this.getPresignedUploadUrl(format);
      const baseUrlForSync = uploadUrl.split("?")[0];
      await this.uploadImageToS3(uploadUrl, imageData, detectedContentType);
      await this.syncImage(baseUrlForSync, finalFileName);
      console.log("LOG: Image upload and sync completed.");
      return baseUrlForSync;
    } catch (error) {
      console.error(`ERROR: Image upload and sync failed from URL: ${error.message}`);
      throw error;
    }
  }
  async enhancePrompt({
    imageUrl,
    prompt
  }) {
    if (!this.token) {
      console.log("INFO: Not authenticated. Running authentication process first.");
      await this.authenticate();
    }
    this.sessionId = this.generateUUID();
    try {
      console.log(`LOG: Enhancing prompt for image: ${imageUrl} with prompt: "${prompt}"...`);
      const response = await this.axiosInstance.post(`${this.baseUrl}/tools/enhance_prompt`, {
        url: imageUrl,
        prompt: prompt
      });
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Enhance prompt failed: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      console.log("LOG: Prompt enhanced successfully.");
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to enhance prompt: ${error.message}`);
      throw error;
    }
  }
  async generate({
    url: imageUrlToUpload,
    prompt,
    audioUrl,
    sceneId = "9",
    model = "lora",
    loraId = "85",
    ratio = "portrait",
    seconds = "5",
    strength = "1.0",
    engine = "turbo",
    audio = "2",
    lipsync = "2",
    ...rest
  }) {
    if (!this.token) {
      console.log("INFO: Not authenticated. Running authentication process first.");
      await this.authenticate();
    }
    const url = await this.uploadImage(imageUrlToUpload);
    this.sessionId = this.generateUUID();
    const scene_params = {
      thumbnail: url,
      image_url: url,
      last_image_url: "",
      video_gen_prompt: prompt,
      labelID: "",
      audio_url: audioUrl,
      is_add_background_audio: audio,
      background_audio_url: "",
      lipsync: lipsync,
      aspect_ratio: ratio,
      seconds: seconds,
      replicate_jobId: "",
      lora_id: loraId,
      tags: {
        modelName: "LORA"
      },
      strength: strength,
      engine: engine,
      code: `${Date.now()}_${this.generateUUID()}`,
      ...rest
    };
    try {
      console.log("LOG: Submitting video generation job...");
      const response = await this.axiosInstance.post(`${this.baseUrl}/scene/job/submit`, {
        uuid: this.generateUUID(),
        taskType: "task",
        taskStatus: "queued",
        createdTime: Date.now(),
        scene_id: sceneId,
        model: model,
        scene_params: JSON.stringify(scene_params),
        thumbnail: url,
        image_url: url,
        last_image_url: "",
        video_gen_prompt: prompt,
        labelID: "",
        audio_url: audioUrl,
        is_add_background_audio: audio,
        background_audio_url: "",
        lipsync: lipsync,
        aspect_ratio: ratio,
        seconds: seconds,
        replicate_jobId: "",
        lora_id: loraId,
        tags: {
          modelName: "LORA"
        },
        strength: strength,
        engine: engine,
        submitting: true,
        ...rest
      });
      const data = response.data;
      if (!data || data.errCode !== 0 || !data.data || !data.data.jobId) {
        throw new Error(`Video generation submission failed: ${data ? data.errMsg : "Invalid response structure or missing jobId."} Response: ${JSON.stringify(data)}`);
      }
      console.log(data);
      console.log(`LOG: Video generation submitted. Job ID: ${data.data.jobId}`);
      const textToEncrypt = JSON.stringify({
        task_id: data.data.jobId,
        sessionId: this.sessionId,
        token: this.token
      });
      const encrypted = CryptoJS.AES.encrypt(textToEncrypt, this.key, {
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      const encrypted_task_id = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      return {
        status: true,
        task_id: encrypted_task_id
      };
    } catch (error) {
      console.error(`ERROR: Failed to generate video: ${error.message}`);
      throw error;
    }
  }
  async status({
    task_id
  }) {
    let decryptedData;
    try {
      const ciphertext = CryptoJS.enc.Hex.parse(task_id);
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext
      });
      const decrypted = CryptoJS.AES.decrypt(cipherParams, this.key, {
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      const json = decrypted.toString(CryptoJS.enc.Utf8);
      if (!json) throw new Error("Failed to decrypt task_id (empty result).");
      decryptedData = JSON.parse(json);
      this.sessionId = decryptedData.sessionId;
      this.token = decryptedData.token;
    } catch (decryptError) {
      console.error(`ERROR: Failed to decrypt task_id: ${decryptError.message}`);
      throw new Error(`Invalid or corrupt task_id provided: ${decryptError.message}`);
    }
    try {
      console.log(`LOG: Checking status for original job ID: ${decryptedData.task_id}...`);
      const response = await this.axiosInstance.get(`${this.videoApiUrl}/job/list_by_job_id?job_id=${decryptedData.task_id}`);
      const data = response.data;
      if (!data || data.errCode !== 0) {
        throw new Error(`Failed to get job status: ${data ? data.errMsg : "No data received."} Response: ${JSON.stringify(data)}`);
      }
      console.log(data);
      console.log(`LOG: Status for job ${decryptedData.task_id} retrieved.`);
      return data;
    } catch (error) {
      console.error(`ERROR: Failed to check video status: ${error.message}`);
      throw error;
    }
  }
}
export default async function handler(req, res) {
  const {
    action,
    ...params
  } = req.method === "GET" ? req.query : req.body;
  if (!action) {
    return res.status(400).json({
      error: "Missing required field: action",
      required: {
        action: "generate | enhance | status"
      }
    });
  }
  const client = new DigenClient();
  try {
    let result;
    switch (action) {
      case "generate":
        if (!params.prompt) {
          return res.status(400).json({
            error: `Missing required fields for 'generate': url, prompt, audioUrl`
          });
        }
        result = await client.generate(params);
        break;
      case "enhance":
        if (!params.imageUrl || !params.prompt) {
          return res.status(400).json({
            error: `Missing required fields for 'enhancePrompt': imageUrl, prompt`
          });
        }
        result = await client.enhancePrompt(params);
        break;
      case "status":
        if (!params.task_id) {
          return res.status(400).json({
            error: `Missing required field for 'status': task_id`
          });
        }
        result = await client.status(params);
        break;
      default:
        return res.status(400).json({
          error: `Invalid action: ${action}. Allowed actions are: generate, enhance, status.`
        });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(`API Error for action ${action}:`, error.message);
    return res.status(500).json({
      error: `Processing error for action '${action}': ${error.message}`
    });
  }
}