import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    review:{type: String, required:true},
});

const Company = mongoose.model('Company', CompanySchema);

export default Company;