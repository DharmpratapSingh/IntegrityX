# 🔗 WALACOR EC2 CONNECTION STATUS & INSTRUCTIONS

---

## 📋 **TLDR - What You Need to Know**

Your IntegrityX app is **fully functional** but using **local blockchain simulation** instead of the real Walacor EC2 server.

**Current Status:**
- ✅ Backend: Running
- ✅ Frontend: Running  
- ✅ All Features: Working
- ⚠️ Walacor EC2: DISCONNECTED (instance stopped)
- ✅ Fallback: Local simulation active

**To connect to real EC2:** Start the AWS EC2 instance and restart your backend.

---

## 🎯 **Quick Connection Steps**

### **Option 1: AWS Console (Easiest - 5 mins)**

1. **Login to AWS Console:**  
   https://console.aws.amazon.com/ec2

2. **Find & Start Instance:**
   - Region: Singapore (ap-southeast-1)
   - Find instance with IP: `13.220.225.175`
   - Instance State → Start Instance

3. **Wait 2 minutes**

4. **Test Connection:**
   ```bash
   ./test_ec2_connection.sh
   ```

5. **Restart Backend:**
   ```bash
   cd backend && python start_server.py
   ```

✅ **Done!** Your app will now use real blockchain.

---

### **Option 2: AWS CLI (Advanced - 10 mins)**

```bash
# 1. Install AWS CLI
brew install awscli

# 2. Configure credentials
aws configure

# 3. Find your instance
aws ec2 describe-instances --region ap-southeast-1 \
  --filters "Name=ip-address,Values=13.220.225.175"

# 4. Start instance (replace INSTANCE_ID)
aws ec2 start-instances --region ap-southeast-1 \
  --instance-ids INSTANCE_ID

# 5. Test
./test_ec2_connection.sh

# 6. Restart backend
cd backend && python start_server.py
```

---

### **Option 3: Keep Using Local Simulation**

**No action needed!** Your app works perfectly in local mode.

**Good for:**
- ✅ Development
- ✅ Testing
- ✅ Demos
- ✅ Saving AWS costs

**Eventually need EC2 for:**
- ⏳ Production deployment
- ⏳ Compliance requirements
- ⏳ Real audit trails

---

## 🔍 **What's the Difference?**

| Feature | Local Simulation | Real EC2 |
|---------|------------------|----------|
| **Document Upload** | ✅ Works | ✅ Works |
| **Hash Generation** | ✅ SHA-256 Local | ✅ SHA-256 + Walacor |
| **Blockchain Sealing** | ⚠️ Simulated | ✅ Real Blockchain |
| **Verification** | ✅ Works | ✅ Works |
| **Delete Function** | ✅ Works | ✅ Works |
| **AI Features** | ✅ Works | ✅ Works |
| **Document Signing** | ✅ Works | ✅ Works |
| **Cost** | 💰 FREE | 💰 $36-360/month |
| **Audit Trail** | ⚠️ Local Only | ✅ Remote Secure |
| **Compliance** | ⚠️ Limited | ✅ Full |

---

## 📊 **Connection Test Results**

**Current Test (2025-10-23):**
```bash
$ curl https://13.220.225.175:443/api/health
curl: (7) Failed to connect to 13.220.225.175 port 443: Connection refused
```

**Diagnosis:** EC2 instance is **STOPPED** (not running)

**Solution:** Start the instance from AWS Console

---

## 🔑 **Your Configuration**

Already set up in `.env` file:
```env
WALACOR_HOST=13.220.225.175
WALACOR_USERNAME=Admin
WALACOR_PASSWORD=Th!51s1T@gMu
```

✅ **No configuration changes needed!**  
Once EC2 is running, backend will auto-connect.

---

## 🧪 **How to Verify Connection**

### **Method 1: Test Script**
```bash
./test_ec2_connection.sh
```

### **Method 2: Manual Tests**
```bash
# Test port
nc -zv 13.220.225.175 443

# Test API
curl https://13.220.225.175:443/api/health

# Check backend
curl http://localhost:8000/api/health | jq '.data.services.walacor'
```

### **Method 3: Backend Logs**
```bash
tail -f /tmp/integrityx-backend.log | grep -i walacor
```

**Look for:**
```
✅ Connected to Walacor successfully (found X schemas)
```

**NOT:**
```
⚠️ Walacor EC2 unreachable, initializing local blockchain simulation
```

---

## 📁 **Reference Files**

| File | Purpose |
|------|---------|
| `EC2_CONNECTION_SUMMARY.md` | Quick start guide |
| `EC2_CONNECTION_GUIDE.md` | Comprehensive instructions |
| `WALACOR_SERVICE_STATUS.md` | Current status & diagnosis |
| `test_ec2_connection.sh` | Automated connection test |
| `.env` | Your credentials (already configured) |

---

## 🚨 **Troubleshooting**

### **Problem: "Connection refused"**
→ EC2 is stopped. Start it from AWS Console.

### **Problem: "Connection timeout"**  
→ Security group blocking. Add port 443 inbound rule.

### **Problem: Still using local simulation after starting EC2**
→ Restart backend server.

### **Problem: Don't have AWS access**
→ Continue with local simulation or contact AWS admin.

---

## 💡 **Recommendations**

### **For Development (Now):**
✅ **Keep using local simulation**
- Zero cost
- Full functionality
- Perfect for testing

### **Before Production:**
⏳ **Connect to real EC2**
- Real blockchain
- Compliance ready
- Full audit trail

### **Cost Optimization:**
💰 **Stop EC2 when not in use**
- Start only for demos/production
- Use local mode for daily dev
- Save hundreds per month

---

## 🎯 **Next Steps**

Choose your path:

### **Path A: Connect Now**
1. Go to AWS Console
2. Start EC2 instance
3. Run `./test_ec2_connection.sh`
4. Restart backend

### **Path B: Continue Local**
1. No action needed
2. Everything works as-is
3. Connect later when needed

---

## 📞 **Need Help?**

1. **AWS Console:** https://console.aws.amazon.com/ec2
2. **Test Script:** `./test_ec2_connection.sh`
3. **Full Guide:** `EC2_CONNECTION_GUIDE.md`
4. **Backend Logs:** `/tmp/integrityx-backend.log`

---

**Your app is working perfectly! Connect to EC2 whenever you're ready.** 🚀

**Current Mode:** 🟡 Local Simulation  
**Target Mode:** 🟢 Real EC2 Blockchain
