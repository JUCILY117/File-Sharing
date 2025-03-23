const FtpSrv = require("ftp-srv");
const fs = require("fs");
const path = require("path");
const os = require("os");

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === "IPv4" && !config.internal) {
                return config.address;
            }
        }
    }
    return "127.0.0.1";
}

const FTP_PORT = 2121;
const LOCAL_IP = getLocalIP();

const ftpServer = new FtpSrv({
    url: `ftp://${LOCAL_IP}:${FTP_PORT}`,
    anonymous: true,
});

ftpServer.on("login", ({ connection, username }, resolve) => {
    console.log(`✅ Client connected: ${connection.ip}`);

    connection.on("STOR", (fileName, stream) => {
        const filePath = path.join(__dirname, "shared", fileName);
        const writeStream = fs.createWriteStream(filePath);

        let transferred = 0;
        const startTime = Date.now();

        stream.on("data", (chunk) => {
            transferred += chunk.length;
            const elapsedTime = (Date.now() - startTime) / 1000;
            const speed = (transferred / (1024 * 1024)) / elapsedTime;

            if (elapsedTime > 0) {
                const estimatedTime = ((stream.bytesExpected - transferred) / (speed * 1024 * 1024)) || 0;
                process.stdout.write(`\r📂 Transferring ${fileName} | Speed: ${speed.toFixed(2)} MB/s | ETA: ${estimatedTime.toFixed(1)}s`);
            }
        });

        stream.pipe(writeStream);

        stream.on("end", () => {
            console.log(`\n✅ Completed: ${fileName} (${(transferred / (1024 * 1024)).toFixed(2)} MB)`);
        });

        stream.on("error", (err) => {
            console.error(`❌ Transfer failed for ${fileName}: ${err.message}`);
        });
    });

    resolve({ root: path.join(__dirname, "shared") });
});

ftpServer.listen().then(() => {
    console.log(`🚀 FTP Server running at ftp://${LOCAL_IP}:${FTP_PORT}/`);
});
