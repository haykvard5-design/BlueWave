const socket = io();
let myName = "";

function login() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username: u, password: p })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            myName = u;
            document.getElementById("auth").style.display = "none";
            document.getElementById("chat").style.display = "flex";
        } else {
            document.getElementById("error").textContent = d.error;
        }
    });
}

function register() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username: u, password: p })
    })
    .then(r => r.json())
    .then(d => alert(d.success ? "Регистрация завершена!" : d.error));
}

function send() {
    const input = document.getElementById("msgInput");
    if (input.value.trim()) {
        socket.emit("msg", { user: myName, content: input.value });
        input.value = "";
    }
}

socket.on("msg", data => {
    const div = document.createElement("div");
    div.style.padding = "10px";
    div.style.borderRadius = "12px";
    div.style.background = data.user === myName ? "#e3f2fd" : "#f1f1f1";
    div.style.alignSelf = data.user === myName ? "flex-end" : "flex-start";
    div.innerHTML = `<small>${data.user}</small><br>${data.content}`;
    document.getElementById("messages").appendChild(div);
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
});
const socket = io();
let myName = "", currentPartner = "";

function login() {
    const user = document.getElementById("username").value;
    if(!user) return alert("Введите логин");
    myName = user;
    document.getElementById("auth").style.display = "none";
    document.getElementById("chat").style.display = "block";
    socket.emit("identify", myName);
}

function send() {
    const msg = document.getElementById("msgInput").value;
    if(msg && currentPartner) {
        socket.emit("private_msg", { to: currentPartner, content: msg, type: "text" });
        document.getElementById("msgInput").value = "";
    }
}

function sendImage() {
    const file = document.getElementById("imageInput").files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        socket.emit("private_msg", { to: currentPartner, content: e.target.result, type: "image" });
    };
    reader.readAsDataURL(file);
}

socket.on("new_private_msg", data => {
    const div = document.createElement("div");
    div.className = data.from === myName ? "my-msg" : "their-msg";
    if(data.type === "image") {
        const img = document.createElement("img");
        img.src = data.content;
        img.style.maxWidth = "200px";
        div.appendChild(img);
    } else {
        div.innerText = data.content;
    }
    document.getElementById("messages").appendChild(div);
});

socket.on("updateUserList", users => {
    const list = document.getElementById("userList");
    list.innerHTML = "";
    users.forEach(u => {
        if(u !== myName) {
            const btn = document.createElement("div");
            btn.className = "user-item";
            btn.innerText = u;
            btn.onclick = () => { currentPartner = u; document.getElementById("chatTitle").innerText = u; };
            list.appendChild(btn);
        }
    });
});