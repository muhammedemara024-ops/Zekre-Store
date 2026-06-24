var logregbox = document.querySelector(".log-regbox")
var loginlink = document.querySelector(".login-link")
var registerlink = document.querySelector(".register-link")

registerlink.addEventListener("click", function () {
    logregbox.classList.add("active")
    reg_email.value = ""
    reg_name.value = ""
    reg_password.value =""
    validation_msg.style.display = "none"
})

loginlink.addEventListener("click", function () {
    logregbox.classList.remove("active")
    login_password.value = ""
    login_email.value = ""
    error_msg.style.display = "none"
})


//====================================================
var reg_name = document.querySelector("#name-register")
var reg_email = document.querySelector("#email-register")
var reg_password = document.querySelector("#password-register")
var reg_btn = document.querySelector("#register-btn")
var validation_msg = document.querySelector("#validation-msg")

var login_btn = document.querySelector("#login-btn")
var login_password = document.querySelector("#password-login")
var login_email = document.querySelector("#email-login")
var error_msg = document.querySelector("#error-msg")

var islogin;
var currentuser;
var users = JSON.parse(localStorage.getItem("users")) || [];



// ================= Validation ===================== 

function ValidateEmail() {
    reg_email.value = reg_email.value.trim()
    let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(reg_email.value)) {
        validation_msg.style.fontSize = "1rem";
        showError("Please enter a valid email address")
        return false;
    }
    hideError()
    return true;
}

function ValidateName() {
    reg_name.value = reg_name.value.trim()
    let pattern = /^[A-Za-z\s]+$/;

    if (!reg_name.value) {
        showError("Name is required")
        return false;
    }
    else if (!pattern.test(reg_name.value)) {
        validation_msg.style.fontSize = "1rem";
        showError("Name should contain letters only")
        return false;
    }
    hideError()
    return true;
}

function ValidatePassword() {
    reg_password.value = reg_password.value.trim()
    let pattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!pattern.test(reg_password.value)) {
        validation_msg.style.fontSize = "0.6rem";
        showError("Password must contain letters, numbers and be at least 6 characters")
        return false;
    }
    hideError()
    return true;
}

// ================= Register ======================== 

reg_btn.addEventListener("click", function (e) {
    e.preventDefault()

    if (!ValidateEmail() || !ValidateName() || !ValidatePassword()) {return;}

    let existUser = users.find(user => user.email === reg_email.value)

    if (existUser) {
        showError("This email already used")
        return;
    }

    var new_user = {
        name: reg_name.value,
        email: reg_email.value,
        password: reg_password.value,
        items:[],
        wishlist:[]
    }

    users.push(new_user)
    localStorage.setItem("users", JSON.stringify(users))

    reg_name.value = ""
    reg_email.value = ""
    reg_password.value = ""

    alert("Registration Successful! Please login with your credentials.")
    
    // Switch to login form
    logregbox.classList.remove("active")
    login_email.value = reg_email.value
})

// ================= Messages ===========================

function showError(msg) {
    validation_msg.style.display = "block"
     validation_msg.innerHTML = msg 
}

function hideError() {
     validation_msg.style.display = "none"
}

console.log(users);


login_btn.addEventListener("click",function(e){
    e.preventDefault()

    let loginuser = users.find(user => user.email === login_email.value.trim() && user.password === login_password.value.trim())
    if(!loginuser)
    {
        error_msg.style.display = "block"
        error_msg.innerHTML ="Email or password is incorrect"
        return false;
    }

    // Store consistent user object with 'user' key - INCLUDING PASSWORD
    currentuser={
        name:loginuser.name,
        email:loginuser.email,
        password:loginuser.password, // PRESERVE PASSWORD
        items:loginuser.items || [],
        wishlist:loginuser.wishlist || [],
        shippingAddress:loginuser.shippingAddress || null,
        orders:loginuser.orders || []
    }
    localStorage.setItem("user",JSON.stringify(currentuser))

    // Load user-specific wishlist
    if (currentuser.wishlist && currentuser.wishlist.length > 0) {
        localStorage.setItem("wishlist", JSON.stringify(currentuser.wishlist))
    } else {
        localStorage.setItem("wishlist", JSON.stringify([]))
    }

    // Load user-specific cart
    if (currentuser.items && currentuser.items.length > 0) {
        localStorage.setItem("cart", JSON.stringify(currentuser.items))
    }

    islogin = true
    localStorage.setItem("islogin",JSON.stringify(islogin))

    error_msg.style.display = "none"
    window.location.href = "./index.html"
    return true;
})
