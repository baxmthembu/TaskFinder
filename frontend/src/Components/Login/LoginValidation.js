function Validation(values) {
    let error = {}
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/

    /*if(!email_pattern.test(values.email)) {
        error.email = "Email didn't match"
    }else{
        error.email= ""*/
    if (!password_pattern.test(values.password)) {
        error.password = "Password didn't match"
    }else{
        error.password= ""
    }
}
    export default Validation