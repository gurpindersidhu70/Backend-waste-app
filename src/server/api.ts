import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, UserRole, User, initDemoData } from "./db";

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "demo-secret-key";

// --- Middleware ---

const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("[Auth] Unauthorized: Missing Authorization header");
    return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("[Auth] Unauthorized: Token missing in Authorization header");
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = db.users.find(u => u.id === decoded.id);
    if (!req.user) {
      console.log(`[Auth] Unauthorized: User not found for ID ${decoded.id}`);
      throw new Error("User not found");
    }
    console.log(`[Auth] Authenticated user: ${req.user.name} (${req.user.role})`);
    next();
  } catch (error) {
    console.log(`[Auth] Unauthorized: Invalid token - ${error instanceof Error ? error.message : "unknown error"}`);
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (roles: UserRole[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// --- Auth Routes ---

apiRouter.post("/auth/login", (req, res) => {
  const { phone, role } = req.body;
  const user = db.users.find(u => u.phone === phone && u.role === role);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, user });
});

apiRouter.post("/login", (req, res) => {
  const { phone, role } = req.body;
  const user = db.users.find(u => u.phone === phone && u.role === role);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, user });
});

// Citizen login with mobile number / OTP mock flow
apiRouter.post("/auth/citizen/otp-request", (req, res) => {
  const { phone } = req.body;
  // In real app, send OTP. Here, just return success.
  res.json({ message: "OTP sent to " + phone, mockOtp: "1234" });
});

apiRouter.post("/auth/citizen/otp-verify", (req, res) => {
  const { phone, otp } = req.body;
  if (otp !== "1234") return res.status(401).json({ error: "Invalid OTP" });

  let user = db.users.find(u => u.phone === phone && u.role === UserRole.CITIZEN);
  if (!user) {
    // Auto-register for demo
    user = { id: `u${db.users.length + 1}`, name: "New Citizen", phone, role: UserRole.CITIZEN };
    db.users.push(user);
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, user });
});

apiRouter.get("/notifications", authenticate, (req: any, res) => {
  const notifications = db.notifications.filter(n => n.userId === req.user.id);
  res.json(notifications);
});

apiRouter.get("/state", authenticate, (req: any, res) => {
  // System-wide summary state
  const state = {
    user: req.user,
    summary: {
      totalTrucks: db.trucks.length,
      activeTrucks: db.trucks.filter(t => t.status === 'on-route').length,
      pendingComplaints: db.complaints.filter(c => c.status === 'pending').length,
      unreadNotifications: db.notifications.filter(n => n.userId === req.user.id && !n.read).length
    }
  };
  res.json(state);
});

// --- Citizen APIs ---

apiRouter.get("/citizen/profile", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  res.json(req.user);
});

apiRouter.get("/citizen/zone", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const zone = db.zones.find(z => z.id === req.user.zoneId);
  res.json(zone || null);
});

apiRouter.get("/citizen/truck", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const truck = db.trucks.find(t => t.zoneId === req.user.zoneId);
  res.json(truck || null);
});

apiRouter.get("/citizen/complaints", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const complaints = db.complaints.filter(c => c.citizenId === req.user.id);
  res.json(complaints);
});

apiRouter.post("/citizen/requests", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const { type, description, location, address, preferredDate, preferredTime, notes, attachmentUrl } = req.body;
  
  const prefix = type === 'complaint' ? 'CMP' : 'REQ';
  const refNum = `${prefix}-${1000 + db.complaints.length + 1}`;

  const newRequest: any = {
    id: `c${db.complaints.length + 1}`,
    citizenId: req.user.id,
    type,
    description,
    location,
    address,
    preferredDate,
    preferredTime,
    notes,
    attachmentUrl,
    referenceNumber: refNum,
    zoneId: req.user.zoneId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.complaints.push(newRequest);

  // Notify admin (mock)
  db.notifications.push({
    id: `n${db.notifications.length + 1}`,
    userId: 'a1', // Admin
    title: 'New Service Request',
    message: `A new ${type} (${refNum}) has been submitted by ${req.user.name}.`,
    read: false,
    type: 'request-update',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(newRequest);
});

apiRouter.get("/citizen/notifications", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const notifications = db.notifications.filter(n => n.userId === req.user.id);
  res.json(notifications);
});

apiRouter.get("/citizen/notifications/unread-count", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const count = db.notifications.filter(n => n.userId === req.user.id && !n.read).length;
  res.json({ count });
});

apiRouter.patch("/citizen/notifications/:id/read", authenticate, authorize([UserRole.CITIZEN]), (req: any, res) => {
  const notification = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notification) {
    notification.read = true;
    res.json(notification);
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

apiRouter.get("/citizen/segregation-tips", (req, res) => {
  res.json([
    { title: "Green Bin", description: "Organic/Wet waste like fruit peels, leftover food." },
    { title: "Blue Bin", description: "Recyclables like paper, plastic, glass bottles." },
    { title: "Yellow Bin", description: "Hazardous waste like batteries, light bulbs." }
  ]);
});

// --- Driver APIs ---

apiRouter.post("/driver/check-in", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const checkIn = {
    id: `a${db.attendance.length + 1}`,
    driverId: req.user.id,
    checkIn: new Date().toISOString(),
    status: "present" as const,
  };
  db.attendance.push(checkIn);
  res.json(checkIn);
});

apiRouter.post("/driver/check-out", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const attendance = db.attendance.find(a => a.driverId === req.user.id && !a.checkOut);
  if (attendance) {
    attendance.checkOut = new Date().toISOString();
  }
  res.json(attendance || { error: "No active check-in found" });
});

apiRouter.post("/driver/location", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const { lat, lng } = req.body;
  const truck = db.trucks.find(t => t.driverId === req.user.id);
  if (truck) {
    truck.location = { lat, lng };
    
    // Simple geofence logic: If within 10m of a stop, mark as 'verified'
    const stops = db.routeStops.filter(s => s.truckId === truck.id && s.status === 'in-progress');
    stops.forEach(stop => {
      const dist = Math.sqrt(Math.pow(stop.location.lat - lat, 2) + Math.pow(stop.location.lng - lng, 2));
      if (dist < 0.0005) { // Roughly 50 meters
        stop.status = 'verified';
      }
    });

    res.json({ success: true, location: truck.location });
  } else {
    res.status(404).json({ error: "No truck assigned to this driver" });
  }
});

apiRouter.get("/driver/routes", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const truck = db.trucks.find(t => t.driverId === req.user.id);
  if (!truck) return res.status(404).json({ error: "No truck assigned" });
  
  const stops = db.routeStops.filter(s => s.truckId === truck.id);
  res.json({ truck, stops });
});

apiRouter.patch("/driver/routes/stops/:id/status", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const { status } = req.body;
  const stop = db.routeStops.find(s => s.id === req.params.id);
  
  if (!stop) return res.status(404).json({ error: "Stop not found" });

  // Verification gate: Only 'verified' stops can be marked 'completed'
  if (status === 'completed' && stop.status !== 'verified') {
    return res.status(400).json({ error: "Stop must be verified by GPS location first" });
  }

  stop.status = status;
  if (status === 'completed') {
    stop.completedAt = new Date().toISOString();
  }
  
  res.json(stop);
});

apiRouter.get("/driver/routes/progress", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const truck = db.trucks.find(t => t.driverId === req.user.id);
  if (!truck) return res.status(404).json({ error: "No truck assigned" });

  const stops = db.routeStops.filter(s => s.truckId === truck.id);
  const progress = {
    total: stops.length,
    completed: stops.filter(s => s.status === "completed").length,
    verified: stops.filter(s => s.status === "verified").length,
    pending: stops.filter(s => s.status === "pending").length,
    inProgress: stops.filter(s => s.status === "in-progress").length,
  };
  res.json(progress);
});

apiRouter.get("/driver/assignment", authenticate, authorize([UserRole.DRIVER]), (req: any, res) => {
  const truck = db.trucks.find(t => t.driverId === req.user.id);
  const zone = truck ? db.zones.find(z => z.id === truck.zoneId) : null;
  res.json({ truck, zone });
});

// --- Admin APIs ---

apiRouter.get("/admin/zones", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  res.json(db.zones);
});

apiRouter.get("/admin/trucks", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  res.json(db.trucks);
});

apiRouter.get("/admin/complaints", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  res.json(db.complaints);
});

apiRouter.get("/admin/complaints/:id", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  const complaint = db.complaints.find(c => c.id === req.params.id);
  if (complaint) res.json(complaint);
  else res.status(404).json({ error: "Complaint not found" });
});

apiRouter.patch("/admin/complaints/:id", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  const complaint = db.complaints.find(c => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  const { status, adminRemarks, preferredDate, preferredTime } = req.body;
  
  if (status) complaint.status = status;
  if (adminRemarks) complaint.adminRemarks = adminRemarks;
  if (preferredDate) complaint.preferredDate = preferredDate;
  if (preferredTime) complaint.preferredTime = preferredTime;

  // Create notification for citizen
  db.notifications.push({
    id: `n${db.notifications.length + 1}`,
    userId: complaint.citizenId,
    title: 'Update on your request',
    message: `Your request ${complaint.referenceNumber} has been updated to: ${status}.`,
    read: false,
    type: 'request-update',
    createdAt: new Date().toISOString(),
  });

  res.json(complaint);
});

apiRouter.get("/admin/attendance", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  res.json(db.attendance);
});

apiRouter.post("/admin/assign-truck", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  const { truckId, zoneId, driverId } = req.body;
  const truck = db.trucks.find(t => t.id === truckId);
  if (truck) {
    truck.zoneId = zoneId;
    truck.driverId = driverId;
    res.json(truck);
  } else {
    res.status(404).json({ error: "Truck not found" });
  }
});

// --- Demo/Utility ---

apiRouter.get("/demo/reset", (req, res) => {
  initDemoData();
  res.json({ message: "Demo data reset successful" });
});

// Mock GPS Tracking Simulator
setInterval(() => {
  db.trucks.forEach(truck => {
    if (truck.status === 'on-route') {
      // Simulate small movement
      truck.location.lat += (Math.random() - 0.5) * 0.001;
      truck.location.lng += (Math.random() - 0.5) * 0.001;
    }
  });
}, 5000);
