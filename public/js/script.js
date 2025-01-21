function login() {
  const password = document.getElementById("password").value;
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Success") {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("gallery").style.display = "block";
        loadImages();
      } else {
        document.getElementById("error-message").innerText = "Invalid password!";
      }
    })
    .catch((err) => {
      console.error("Error during login:", err);
      document.getElementById("error-message").innerText = "Error during login.";
    });
}

function uploadImage() {
  const fileInput = document.getElementById("imageUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.url) {
        fileInput.value = "";

        // Directly append the new image to the gallery
        const imagesContainer = document.getElementById("images-container");
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("image-container");

        const imgElement = document.createElement("img");
        imgElement.src = data.url;
        imgElement.alt = "Uploaded Image";
        imgContainer.appendChild(imgElement);

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("image-actions");

        const viewBtn = document.createElement("button");
        viewBtn.innerText = "View";
        viewBtn.onclick = () => openImageInNewTab(data.url);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.onclick = () => confirmDelete(data.public_id);

        actionsDiv.appendChild(viewBtn);
        actionsDiv.appendChild(deleteBtn);
        imgContainer.appendChild(actionsDiv);

        imagesContainer.appendChild(imgContainer);
      } else {
        alert("Error uploading image.");
      }
    })
    .catch((err) => {
      console.error("Error during image upload:", err);
      alert("Error during image upload.");
    });
}

function loadImages() {
  fetch(`/images?timestamp=${Date.now()}`) // Avoid cached responses
    .then((res) => res.json())
    .then((images) => {
      const imagesContainer = document.getElementById("images-container");
      imagesContainer.innerHTML = "";

      images.forEach((image) => {
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("image-container");

        const imgElement = document.createElement("img");
        imgElement.src = image.url; // Cloudinary image URL
        imgElement.alt = "Uploaded Image";
        imgContainer.appendChild(imgElement);

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("image-actions");

        const viewBtn = document.createElement("button");
        viewBtn.innerText = "View";
        viewBtn.onclick = () => openImageInNewTab(image.url);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.onclick = () => confirmDelete(image.public_id); // Use Cloudinary public_id

        actionsDiv.appendChild(viewBtn);
        actionsDiv.appendChild(deleteBtn);
        imgContainer.appendChild(actionsDiv);

        imagesContainer.appendChild(imgContainer);
      });
    })
    .catch((err) => {
      console.error("Error loading images:", err);
      alert("Error loading images.");
    });
}

function openImageInNewTab(url) {
  window.open(url, "_blank");
}

function confirmDelete(publicId) {
  const overlay = document.getElementById("overlay");
  overlay.style.display = "flex";

  const confirmBtn = document.getElementById("confirm-delete");
  confirmBtn.onclick = () => deleteImage(publicId);

  const cancelBtn = document.getElementById("cancel-delete");
  cancelBtn.onclick = () => {
    overlay.style.display = "none";
  };
}

function deleteImage(publicId) {
  fetch("/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_id: publicId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Image deleted successfully") {
        // Hide the overlay and reload the images after successful deletion
        document.getElementById("overlay").style.display = "none";
        loadImages();
      } else {
        alert("Error deleting image.");
      }
    })
    .catch((err) => {
      console.error("Error deleting image:", err);
      document.getElementById("overlay").style.display = "none";
      alert("Error deleting image.");
    });
}
