const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;
const SHARE_DIR = path.join(__dirname, "shared");

if (!fs.existsSync(SHARE_DIR)) fs.mkdirSync(SHARE_DIR);

app.use(cors());
app.use(express.static(SHARE_DIR));

const upload = multer({ dest: SHARE_DIR });

app.get("/", (req, res) => {
    fs.readdir(SHARE_DIR, (err, files) => {
        if (err) return res.status(500).send("Error reading files.");
        
        let fileLinks = files.map(file => `<a href="${file}">${file}</a>`).join("<br>");
        res.send(`<h2>Shared Files</h2>${fileLinks}<br><br>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file" required>
            <button type="submit">Upload</button>
        </form>`);
    });
});

app.post("/upload", upload.single("file"), (req, res) => {
    res.send("File uploaded successfully. <a href='/'>Go Back</a>");
});

app.listen(PORT, () => {
    console.log(`File server running at http://${getLocalIP()}:${PORT}/`);
});

function getLocalIP() {
    const nets = require("os").networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }
    return "localhost";
}
