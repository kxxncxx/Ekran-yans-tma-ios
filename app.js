let peer;
const setupPanel = document.getElementById('setupPanel');
const connectPanel = document.getElementById('connectPanel');
const videoElement = document.getElementById('streamVideo');
const localVideo = document.getElementById('localVideo');

// TV (Alıcı) Modu
function startTVMode() {
    const randomId = 'tv-' + Math.floor(Math.random() * 100000);
    peer = new Peer(randomId);
    
    // Acode hatasını önlemek için type eklendi
    peer.on('open', (/** @type {string} */ id) => {
        setupPanel.innerHTML = `<h2>TV Yayına Hazır</h2><p>Tabletten girilecek kod:</p><h1 style="color:#8e44ad;">${id}</h1>`;
    });

    peer.on('call', (/** @type {any} */ call) => {
        call.answer(); 
        call.on('stream', (/** @type {MediaStream} */ remoteStream) => {
            setupPanel.style.display = 'none';
            videoElement.style.display = 'block';
            videoElement.srcObject = remoteStream;
        });
    });
}

// Tablet (Yayıncı) Modu
async function startPadMode() {
    setupPanel.style.display = 'none';
    connectPanel.style.display = 'block';
    peer = new Peer();
}

// Ekranı Yakala, PiP'i Tetikle ve TV'ye Gönder
async function connectToTV() {
    const targetId = document.getElementById('tvCodeId').value;
    if (!targetId) return alert('Lütfen TV kodunu girin.');

    try {
        // 1080p 60FPS zorlaması - Tarayıcının C++ motorunu tetikler
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 60 }
            },
            audio: false 
        });

        // Safari arka planında çalışması için stream'i yerel videoya bağla ve PiP aç
        localVideo.srcObject = stream;
        await localVideo.play();
        
        if (document.pictureInPictureEnabled && !localVideo.disablePictureInPicture) {
            try {
                await localVideo.requestPictureInPicture();
            } catch (pipError) {
                console.warn('PiP açılamadı, yayın arka planda donabilir:', pipError);
            }
        }

        // TV'ye çağrı başlat
        const call = peer.call(targetId, stream);
        connectPanel.innerHTML = `<h2>Yayın Yapılıyor...</h2><p>Hedef: ${targetId}</p><p style="font-size: 12px; color: #ccc;">Ekrandaki küçük PiP penceresini kenara kaydırarak gizleyebilirsin.</p>`;
        
        call.on('close', () => {
            alert('Yayın sonlandı.');
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            }
            location.reload();
        });

    } catch (err) {
        console.error('Ekran yakalama hatası:', err);
        alert('Ekran izni verilmedi veya tarayıcı desteklemiyor.');
    }
}
// Fonksiyonları global window objesine bağlayarak Acode'a kullanıldıklarını kanıtlıyoruz
window.startTVMode = startTVMode;
window.startPadMode = startPadMode;
window.connectToTV = connectToTV;
