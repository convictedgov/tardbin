import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom middleware to log requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const status = (err as any).status || (err as any).statusCode || 500;
      const message = (err as any).message || "Internal Server Error";

      // Ensure that we don't throw an error after sending a response
      if (!res.headersSent) {
        res.status(status).json({ message });
      }

      // Don't throw after the response is sent
    });

    // Vite setup only in development mode
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Server setup and listening on port 5000
    const port = 5000;
    server.listen(port, "127.0.0.1", () => {
      log(`Server is running on port ${port}`);
    });

  } catch (error: unknown) {
    // Now TypeScript knows the error is of type 'unknown', we cast it as 'any'
    log(`Error occurred during server startup: ${(error as Error).message}`);
    process.exit(1); // Exit with an error code
  }
})();
