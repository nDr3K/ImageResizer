const dropZone = document.getElementById('drop-zone');
const imageHolder = document.getElementById('image-holder');
const fileInput = document.getElementById('file-input');
const uploadedImage = document.getElementById('uploaded-image');
const blueSquare = document.getElementById('blue-square');
const cropButton = document.getElementById('crop-button');
const resizeContainer = document.getElementById('size-input-holder');
const addSizeInputButton = document.getElementById('add-size-button');
const resizeButton = document.getElementById('resize-button');
const sizeInputHolder = document.getElementById('size-input-holder');
const croppedImageHolder = document.getElementById('cropped-image-holder');
const croppedImagePreviews = document.getElementById('cropped-image-previews');
const downloadButton = document.getElementById('download-button');

const croppedImage = new Image();
let isDragging = false;
let initialX, initialY, currentX, currentY;

blueSquare.addEventListener('mousedown', (e) => {
    isDragging = true;
    blueSquare.style.cursor = 'grabbing';
    initialX = e.clientX - blueSquare.getBoundingClientRect().left;
    initialY = e.clientY - blueSquare.getBoundingClientRect().top;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    e.preventDefault();

    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    const maxX = blueSquare.parentElement.clientWidth - blueSquare.clientWidth;
    const maxY = blueSquare.parentElement.clientHeight - blueSquare.clientHeight;


    currentX = Math.max(currentX, 0);
    currentY = Math.max(currentY, 0);
    if (currentY < maxY) {
        blueSquare.style.top = currentY + 'px';
    }
    else {
        blueSquare.style.top = maxY + 'px';
    }
    if (currentX < maxX) {
        blueSquare.style.left = currentX + 'px';
    }
    else {
        blueSquare.style.left = maxX + 'px';
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

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    handleFile(file);
});

function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
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
                uploadedImage.style.display = 'block';
                cropButton.style.display = 'block';

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

cropButton.addEventListener('click', () => {
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

    const croppedImageDataUrl = canvas.toDataURL('image/jpeg');

    croppedImage.src = croppedImageDataUrl;
    blueSquare.style.display = 'none';
    cropButton.style.display = 'none';
    dropZone.style.display = 'none';
    addSizeInputButton.style.display = 'block'
    resizeButton.style.display = 'block'

    createInputSizeElement()

    uploadedImage.parentElement.replaceChild(croppedImage, uploadedImage);
});

addSizeInputButton.addEventListener('click', () => {
    createInputSizeElement()
});

function createInputSizeElement() {
    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.placeholder = 'Enter size:';
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
        const resizedImageDataUrl = canvas.toDataURL('image/jpeg');
        const resizedImage = new Image();
        resizedImage.src = resizedImageDataUrl;
        resizedImage.alt = `Resized Image ${size}x${size}`;
        return resizedImage;
    });

    imageHolder.style.display = 'none';
    croppedImagePreviews.style.display = 'flex';
    resizedImages.forEach(resizedImage => {
        croppedImageHolder.appendChild(resizedImage);
    });
});

downloadButton.addEventListener('click', async () => {

    const imageElements = croppedImageHolder.querySelectorAll('img');

    const urls = [];

    imageElements.forEach((image) => {
        const imageSrc = image.src;
        urls.push(imageSrc);
    });

    const promises = urls.map(async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return blob;
    });

    const res = await Promise.all(promises);

    const zip = new JSZip();

    res.forEach((blob, index) => {
        zip.file(`image_${index + 1}.jpeg`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = 'images.zip';
    downloadLink.style.display = 'none';

    downloadLink.click();
    downloadLink.remove();
});