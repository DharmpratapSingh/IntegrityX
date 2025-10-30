# 🔧 CONNECT TO REAL WALACOR EC2 - STEP BY STEP GUIDE

## ❌ **Current Status:**
```
EC2 Host: 13.220.225.175:443
Status: CONNECTION REFUSED (Not responding)
Error: "Failed to connect after 17ms"
```

**This means the EC2 instance is either:**
1. ❌ **STOPPED** (Most likely - instance is shut down)
2. ❌ **Security Group Blocking** (Firewall rules preventing access)
3. ❌ **Service Not Running** (Instance is on, but Walacor service not started)

---

## ✅ **OPTION 1: Start EC2 Instance via AWS Console** (RECOMMENDED)

### **Step 1: Login to AWS Console**
1. Go to: https://console.aws.amazon.com/
2. Login with your AWS credentials
3. Select the **Singapore (ap-southeast-1)** region (top right)

### **Step 2: Find Your EC2 Instance**
1. Search for **EC2** in the search bar
2. Click **Instances (running)**
3. Look for instance with IP: `13.220.225.175`

### **Step 3: Start the Instance**
1. Select the instance (checkbox)
2. Click **Instance State** → **Start Instance**
3. Wait 1-2 minutes for it to start

### **Step 4: Verify Connection**
```bash
# Test the connection
curl https://13.220.225.175:443/api/health

# Should return status info instead of "Connection refused"
```

### **Step 5: Restart Your Backend**
```bash
# Kill current backend
ps aux | grep "python start_server.py" | grep -v grep | awk '{print $2}' | xargs kill -9

# Start backend again (it will auto-connect to EC2)
cd backend
python start_server.py
```

---

## 🔐 **OPTION 2: Using AWS CLI** (Advanced)

### **Step 1: Install AWS CLI**
```bash
# macOS
brew install awscli

# Or via Python
pip install awscli
```

### **Step 2: Configure AWS Credentials**
```bash
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-southeast-1
# - Default output format: json
```

### **Step 3: Find Your Instance ID**
```bash
# List all EC2 instances
aws ec2 describe-instances \
  --region ap-southeast-1 \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,Tags[?Key=='Name'].Value|[0]]" \
  --output table

# Look for the one with IP 13.220.225.175
```

### **Step 4: Start the Instance**
```bash
# Replace <INSTANCE_ID> with your actual instance ID
aws ec2 start-instances \
  --region ap-southeast-1 \
  --instance-ids <INSTANCE_ID>

# Example:
# aws ec2 start-instances --region ap-southeast-1 --instance-ids i-0123456789abcdef
```

### **Step 5: Monitor Instance Status**
```bash
# Check if it's running
aws ec2 describe-instance-status \
  --region ap-southeast-1 \
  --instance-ids <INSTANCE_ID>

# Wait until "InstanceState": "running"
```

### **Step 6: Test Connection**
```bash
# Test the Walacor API
curl https://13.220.225.175:443/api/health
```

---

## 🔒 **OPTION 3: Check Security Group Settings**

If the instance is running but still refusing connections:

### **Via AWS Console:**
1. Go to **EC2** → **Security Groups**
2. Find the security group attached to your instance
3. Check **Inbound Rules**
4. Ensure port **443** is open for your IP or `0.0.0.0/0`

### **Via AWS CLI:**
```bash
# Get security group ID
aws ec2 describe-instances \
  --region ap-southeast-1 \
  --instance-ids <INSTANCE_ID> \
  --query "Reservations[0].Instances[0].SecurityGroups[*].GroupId"

# Describe security group rules
aws ec2 describe-security-groups \
  --region ap-southeast-1 \
  --group-ids <SECURITY_GROUP_ID>

# Add rule for port 443 (if needed)
aws ec2 authorize-security-group-ingress \
  --region ap-southeast-1 \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## 🧪 **VERIFICATION STEPS**

After starting the EC2 instance:

### **1. Test Basic Connectivity:**
```bash
# Ping the server (may not work if ICMP is blocked)
ping 13.220.225.175

# Test HTTPS port
nc -zv 13.220.225.175 443
# Should show: "Connection succeeded"
```

### **2. Test Walacor API:**
```bash
# Health check
curl https://13.220.225.175:443/api/health

# Login endpoint
curl -X POST https://13.220.225.175:443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Th!51s1T@gMu"}'
```

### **3. Check Backend Connection:**
```bash
# Check backend logs
tail -f /tmp/integrityx-backend.log | grep -i walacor

# Should see:
# ✅ Connected to Walacor successfully
# NOT:
# ⚠️ Walacor EC2 unreachable
```

### **4. Test from Your App:**
```bash
# Restart backend
cd backend
python start_server.py

# In another terminal, test health endpoint
curl http://localhost:8000/api/health | jq '.data.services.walacor'

# Should show:
# "status": "up"
# "details": "Walacor service responding (HTTP 200)"
```

---

## 📊 **EXPECTED RESULTS AFTER CONNECTION**

### **Before (Local Simulation):**
```
⚠️ Walacor EC2 unreachable, initializing local blockchain simulation
✅ Local blockchain simulation initialized (Production Mode)
```

### **After (Real EC2 Connected):**
```
✅ Connected to Walacor successfully (found X schemas)
✅ Walacor service initialized and ready
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: "Connection timed out"**
→ EC2 instance is stopped. Start it from AWS Console.

### **Problem: "Connection refused"**
→ Instance is on, but service not running. SSH into EC2 and start Walacor service.

### **Problem: "Network unreachable"**
→ Check your internet connection and firewall settings.

### **Problem: Still using local simulation after starting EC2**
→ Restart your backend server:
```bash
ps aux | grep "python start_server.py" | grep -v grep | awk '{print $2}' | xargs kill -9
cd backend && python start_server.py
```

---

## 💰 **COST CONSIDERATIONS**

**EC2 Instance Costs:**
- Running 24/7: ~$0.05-0.50/hour (depending on instance type)
- Monthly cost: ~$36-360/month

**To Save Costs:**
1. Stop instance when not in use
2. Use AWS Lambda for serverless alternative
3. Use local simulation for development

---

## 🎯 **QUICK START (Simplest Method)**

**If you have AWS Console access:**

1. **Go to AWS Console** → EC2
2. **Find instance** with IP `13.220.225.175`
3. **Click "Start Instance"**
4. **Wait 2 minutes**
5. **Restart your backend:**
   ```bash
   cd backend
   python start_server.py
   ```
6. **Done!** Check logs for "✅ Connected to Walacor successfully"

---

## 📞 **NEED AWS CREDENTIALS?**

If you don't have AWS access:
- Contact your AWS administrator
- Get IAM credentials with EC2 permissions
- Or continue using local simulation mode (works perfectly for dev/demo)

---

**Current Config:**
```
Host: 13.220.225.175
Port: 443
Username: Admin
Password: Th!51s1T@gMu (from .env)
```

**Choose the option that works best for you!** 🚀
