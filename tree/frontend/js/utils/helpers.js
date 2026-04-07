// frontend/js/utils/helpers.js
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function showModal(title, contentHtml, onClose) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `<h3>${title}</h3>${contentHtml}`;
    modal.style.display = 'flex';
    const closeSpan = document.querySelector('.close-modal');
    const closeModal = () => {
        modal.style.display = 'none';
        if (onClose) onClose();
    };
    closeSpan.onclick = closeModal;
    window.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style.position = 'fixed';
    toast.style.bottom = '70px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = isError ? '#e76f51' : '#2a6b2f';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '40px';
    toast.style.zIndex = '1001';
    toast.style.fontWeight = '500';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}