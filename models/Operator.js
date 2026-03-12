class Operator {
    constructor(operator_id, fname, lname, username, email, phone, status, created_at) {
        this.operator_id = operator_id;
        this.fname = fname;
        this.lname = lname;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.created_at = created_at;
    }
}

module.exports = Operator;