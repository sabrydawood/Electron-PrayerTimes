// Get elements
const Modal = document.getElementById("modal");
const ModalOverlay = document.getElementById("modal-overlay");
const OpenModalBtn = document.getElementById("openModalBtn");
const CloseModalBtn = document.querySelector(".close-btn");
const CloseModalVoiceBtn = document.getElementById("modal-close-voice-btn");
const AzanPlayer = document.getElementById("AzanPlayer");
const WarnPlayer = document.getElementById("WarnPlayer");
// Function to open the Modal
OpenModalBtn.addEventListener("click", () => {
  Modal.style.display = "flex";
});
// Function to close the Modal
CloseModalBtn.addEventListener("click", () => {
  Modal.style.display = "none";
});
ModalOverlay.addEventListener("click", () => {
  Modal.style.display = "none";
});
CloseModalVoiceBtn.addEventListener("click", CloseVoice);
// Close Modal when clicking outside the Modal content
// window.addEventListener("click", (event) => {
//   if (event.target === Modal) {
//     Modal.style.display = "none";
//   }
// });
function OpenModal(Title, IsWarn = true) {
  if (!IsWarn) {
    document.getElementById(
      "modal-prayer-name"
    ).innerText = `حان الان موعد صلاة  ${Title}`;
  } else {
    document.getElementById(
      "modal-prayer-name"
    ).innerText = `استعد للصلاة القادمة ${Title}`;
    document.getElementById(
      "modal-prayer-text"
    ).innerText = `قال رسول الله صلى الله عليه وسلم: (الصَّلَاةُ الخَمْسُ، وَالْجُمْعَةُ إلى الجُمْعَةِ، كَفَّارَةٌ لِما بيْنَهُنَّ، ما لَمْ تُغْشَ الكَبَائِرُ).`;
  }
  OpenModalBtn.click();
}

function CloseVoice() {
    AzanPlayer.pause();        
    WarnPlayer.pause();
    AzanPlayer.currentTime = 0;
    WarnPlayer.currentTime = 0;
}