import express from "express";
import Company from "../models/Company.js";
import {faker} from "@faker-js/faker";

const router = express.Router();

router.options('/', (req, res)=>{
    res.header('Allow', 'GET, POST, OPTIONS')
    res.status(204).send();
});

const formatCompany = (company) => ({
    id: company._id,
    title: company.title,
    description: company.description,
    review: company.review,
    _links: {
        self: {
            href: `${process.env.LOCALURL}/companys/${company._id}`
        }
    }
});



router.get('/', async (req, res) => {
    try {
        const companys = await Company.find();
        const items = companys.map(formatCompany); // Kijk boven voor fucntie

        res.json({
            items,
            _links: {
                self: {
                    href: `${process.env.LOCALURL}/companys`
                },
                collection: {
                    href: `${process.env.LOCALURL}/companys`
                }
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




router.post('/seed', async (req, res)=>{
    try{
        //alles verwijderen voordat we nieuwe toevoegen
        await Company.deleteMany({});

        //nieuwe toevoegen
        for (let i = 0; i < req.body.amount; i++){
            await Company.create({
                title: faker.word.adjective(),
                description: faker.lorem.paragraph(),
                review: faker.lorem.paragraph({min:1, max:5})
            });
        }

        res.json({message: 'Created companys'})
    }catch (e){
        console.log(e);
        res.json({error: e.message});
    }
});

router.get('/:_id', async (req, res) => {
    try {
        const company = await Company.findById(req.params._id);

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json({
            item: formatCompany(company) // Kijk boven voor fucntie
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



export default router;


