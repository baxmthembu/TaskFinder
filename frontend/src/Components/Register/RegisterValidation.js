function Validation(values) {
    let error = {}
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const password_pattern =  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    /*/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/*/


    if(values.name === '') {
        error.name = 'Name is required'
    }

    if(values.surname === '') {
        error.surname = 'Surname is required'
    }

    if(values.email === '') {
        error.email = 'Email required'
    }else{
        error.email= ""
    }
    
    
    if(values.password === '') {
        error.password = "Password required"
    }else{
        error.password= ""
    }

    if(values.username === '') {
        error.username = "Username is required"
    }

    return error
}

export default Validation
