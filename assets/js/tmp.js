var emails = document.querySelectorAll('.emailbox-item')

for (let index = 0; index < emails.length; index++) {
    const email = emails[index];
    console.log(email.innerText)
}