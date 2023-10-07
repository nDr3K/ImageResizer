const dropZone = document.getElementById('drop-zone');
const imageHolder = document.getElementById('image-holder');
const fileInput = document.getElementById('file-input');
const uploadedImage = document.getElementById('uploaded-image');
const blueSquare = document.getElementById('blue-square');
const blueSquareText = document.getElementById('blue-square-text');
const cropButton = document.getElementById('crop-button');
const resizeContainer = document.getElementById('size-input-holder');
const addSizeInputButton = document.getElementById('add-size-button');
const resizeButton = document.getElementById('resize-button');
const sizeInputHolder = document.getElementById('size-input-holder');
const croppedImageHolder = document.getElementById('cropped-image-holder');
const croppedImagePreviews = document.getElementById('cropped-image-previews');
const downloadButton = document.getElementById('download-button');
const subTitleH2 = document.querySelector('#page-title h2');
const subTitleP = document.querySelector('#page-title p');
const checkboxBgRemoverHolder = document.getElementById('background-remover-checkbox-holder');
const loader = document.getElementById('loader-holder');
const modal = document.getElementById('variables-modal');
const openModalButton = document.getElementById('open-modal-button');
const modalSubmitButton = document.getElementById('modal-submit');
const modalDisableButton = document.getElementById('modal-disable');
const endpointInput = document.getElementById('remover-endpoint');
const apikeyInput = document.getElementById('remover-api-key');

let endpoint = localStorage.getItem('endpoint');
let api_key = localStorage.getItem('api_key');

const croppedImage = new Image();
let isDragging = false;
let initialX, initialY, offsetX, offsetY, maxX, maxY;
let fileName = 'image';

if (!endpoint && !api_key) {
    modal.showModal();
}

modalSubmitButton.addEventListener('click', () => {
    endpoint = endpointInput.value;
    api_key = apikeyInput.value;
    localStorage.setItem('endpoint', endpoint);
    localStorage.setItem('api_key', api_key);
    modal.close();
});

modalDisableButton.addEventListener('click', () => {
    modal.close();
});

openModalButton.addEventListener('click', () => {
    modal.showModal();
});

blueSquare.addEventListener('mousedown', (e) => {
    isDragging = true;
    blueSquare.style.cursor = 'grabbing';
    initialX = e.clientX;
    initialY = e.clientY;
    offsetX = blueSquare.offsetLeft;
    offsetY = blueSquare.offsetTop;
    maxX = blueSquare.parentElement.clientWidth - blueSquare.clientWidth;
    maxY = blueSquare.parentElement.clientHeight - blueSquare.clientHeight;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const newX = offsetX + (e.clientX - initialX);
    const newY = offsetY + (e.clientY - initialY);

    if (newX >= 0 && newX <= maxX) {
        blueSquare.style.left = newX + 'px';
    }

    if (newY >= 0 && newY <= maxY) {
        blueSquare.style.top = newY + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    blueSquare.style.cursor = 'grab';
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, () => {
        dropZone.style.border = '2px solid #007BFF';
    });
});

['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, () => {
        dropZone.style.border = '2px dashed #ccc';
    });
});

dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    handleFile(file);
});

function handleFile(file) {
    clearData();
    if (file && file.type.startsWith('image/')) {
        fileName = file.name.replace(/\.[^/.]+$/, "");
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const newHeight = 400;
                const newWidth = newHeight * aspectRatio;

                img.width = newWidth;
                img.height = newHeight;

                uploadedImage.src = img.src;
                uploadedImage.width = newWidth;
                uploadedImage.height = newHeight;
                imageHolder.style.display = 'flex';
                blueSquare.style.display = 'block';
                blueSquareText.style.display = 'block';
                uploadedImage.style.display = 'block';
                dropZone.style.display = 'none';
                cropButton.style.display = 'block';
                subTitleH2.style.display = 'none';
                subTitleP.style.display = 'none';
                croppedImagePreviews.style.display = 'none';
                if (endpoint && api_key) {
                    checkboxBgRemoverHolder.style.display = 'flex';
                }

                const imageSize = Math.min(newWidth, newHeight);

                blueSquare.style.width = imageSize + 'px';
                blueSquare.style.height = imageSize + 'px';

                blueSquare.style.left = '0';

                const topOffset = (newHeight - imageSize) / 2;
                blueSquare.style.top = topOffset + 'px';
            };
        };

        reader.readAsDataURL(file);
    } else {
        alert('Please select a valid image file.');
    }
}

cropButton.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = blueSquare.clientWidth;
    canvas.height = blueSquare.clientHeight;

    const parentRect = blueSquare.parentElement.getBoundingClientRect();
    const cropX = (blueSquare.getBoundingClientRect().left - parentRect.left) / parentRect.width * uploadedImage.naturalWidth;
    const cropY = (blueSquare.getBoundingClientRect().top - parentRect.top) / parentRect.height * uploadedImage.naturalHeight;

    const cropWidth = (canvas.width / parentRect.width) * uploadedImage.naturalWidth;
    const cropHeight = (canvas.height / parentRect.height) * uploadedImage.naturalHeight;

    ctx.drawImage(uploadedImage, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

    blueSquare.style.display = 'none';
    blueSquareText.style.display = 'none';
    checkboxBgRemoverHolder.style.display = 'none';
    cropButton.style.display = 'none';
    uploadedImage.style.display = 'none';

    const checkboxBgRemover = document.getElementById('background-remover-checkbox');

    const croppedImageDataUrl = canvas.toDataURL('image/png');

    if (checkboxBgRemover.checked) {
        loader.style.display = 'flex';
        await removeBackground(croppedImageDataUrl);
    } else {
        croppedImage.src = croppedImageDataUrl;
        uploadedImage.parentElement.replaceChild(croppedImage, uploadedImage);
        displayCroppedImage();
    }

});

function displayCroppedImage() {
    addSizeInputButton.style.display = 'block';
    resizeButton.style.display = 'block';
    uploadedImage.style.display = 'block';
    createInputSizeElement()
}

addSizeInputButton.addEventListener('click', () => {
    createInputSizeElement()
});

function createInputSizeElement() {
    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.placeholder = 'Enter size (ex. 32):';
    sizeInput.min = 1;
    resizeContainer.appendChild(sizeInput);
}

resizeButton.addEventListener('click', () => {
    const sizeInputs = sizeInputHolder.querySelectorAll('input[type="number"]');
    
    const sizes = [];
    sizeInputs.forEach(input => {
        const sizeValue = parseInt(input.value);
        if (!isNaN(sizeValue) && sizeValue > 0) {
            sizes.push(sizeValue);
        }
    });
    
    if (sizes.length === 0) {
        alert('Please enter valid size values.');
        return;
    }

    const resizedImages = sizes.map(size => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(croppedImage, 0, 0, size, size);
        const resizedImageDataUrl = canvas.toDataURL('image/png');
        const resizedImage = new Image();
        resizedImage.src = resizedImageDataUrl;
        resizedImage.alt = `Resized Image ${size}x${size}`;
        return resizedImage;
    });

    imageHolder.style.display = 'none';
    addSizeInputButton.style.display = 'none'
    resizeButton.style.display = 'none'
    croppedImagePreviews.style.display = 'flex';
    resizedImages.forEach(resizedImage => {
        croppedImageHolder.appendChild(resizedImage);
    });
});

downloadButton.addEventListener('click', async () => {

    const imageElements = croppedImageHolder.querySelectorAll('img');

    const urls = [];
    const sizes = [];

    imageElements.forEach((image) => {
        console.log(image)
        sizes.push(image.alt);
        urls.push(image.src);
    });

    const promises = urls.map(async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return blob;
    });

    const res = await Promise.all(promises);

    const zip = new JSZip();

    res.forEach((blob, index) => {
        zip.file(`${fileName}_${sizes[index].replace('Resized Image ','')}.png`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = 'images.zip';
    downloadLink.style.display = 'none';

    downloadLink.click();
    downloadLink.remove();

    subTitleH2.style.display = 'block';
    subTitleP.style.display = 'block';
    dropZone.style.display = 'block';
    croppedImage.parentElement.replaceChild(uploadedImage, croppedImage);
    fileName = 'image';
});

function clearData() {
    while (croppedImageHolder.firstChild) {
        croppedImageHolder.removeChild(croppedImageHolder.firstChild);
    }

    while (resizeContainer.firstChild) {
        resizeContainer.removeChild(resizeContainer.firstChild);
    }
}

async function removeBackground(imageData) {
    const base64Image = imageData.split(',')[1];
    const binaryImage = atob(base64Image);
    const byteArray = new Uint8Array(binaryImage.length);
    for (let i = 0; i < binaryImage.length; i++) {
        byteArray[i] = binaryImage.charCodeAt(i);
    }
    const url = `https://${endpoint}.cognitiveservices.azure.com/computervision/imageanalysis:segment?api-version=2023-02-01-preview&mode=backgroundRemoval`;
    const headers = {
        'Content-Type' : 'application/octet-stream',
        'Ocp-Apim-Subscription-Key' : api_key
    };

    fetch(url, {
        method: 'POST',
        headers: headers,
        body: byteArray
    })
    .then(async (response) => {
        if (!response.ok) {
            throw new Error("API request failed.");
        } else {
            const contentType = response.headers.get("Content-Type");
            if (contentType === "image/png") {
                return response.blob();
              } else {
                throw new Error("Unexpected response content type: " + contentType);
              }
        }
    })
    .then((imageBlob) => {
        const imageUrl = URL.createObjectURL(imageBlob);
        croppedImage.src = imageUrl;
        uploadedImage.parentElement.replaceChild(croppedImage, uploadedImage);
        loader.style.display = 'none';
        displayCroppedImage();
    })
    .catch((error) => {
        console.error('Error: ', error);
    });
}