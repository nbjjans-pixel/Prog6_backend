import express from "express";
import Company from "../models/Company.js";
import {faker} from "@faker-js/faker";
import cors from 'cors';

const router = express.Router();

const acceptJsonMiddleware = (req, res, next) => {
    if (req.headers['accept'] !== 'application/json') {
        return res.status(406).json({error: 'Accept header must be application/json'});
    }
    next();
};
router.use(acceptJsonMiddleware);

const corsMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Sta toegang toe van alle domeinen
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
};


// Voeg de middleware toe voor alle routes
router.use(corsMiddleware);
router.options('/', (req, res)=>{
    res.header('Allow', 'GET, POST OPTIONS');
    res.header('Access-Control-Allow-Methods', 'GET, PUT OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization' );
    res.status(204).send();
});

router.options('/:_id', (req, res) => {
    res.header('Allow', 'GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization' );
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
        },
        collection: {
            href: `${process.env.LOCALURL}/companys`
        }

    }
});



router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || null; // Fallback naar null als geen paginering
        const limit = parseInt(req.query.limit) || null;

        const baseUrl = `${process.env.LOCALURL}/companys`;

        if (!page || !limit) {
            // Geen paginering ingesteld, haal alles op
            const companys = await Company.find();
            const items = companys.map(formatCompany);

            res.json({
                items,
                _links: {
                    self: { href: baseUrl }
                },
                pagination: {
                    currentPage: 1,
                    currentItems: items.length,
                    totalPages: 1,
                    totalItems: items.length,
                    _links: {
                        first: { page: 1, href: baseUrl },
                        last: { page: 1, href: baseUrl },
                        previous: null,
                        next: null
                    }
                }
            });
            return;
        }

        // Bereken paginering
        const skip = (page - 1) * limit;
        const totalItems = await Company.countDocuments();
        const totalPages = Math.ceil(totalItems / limit);

        const companys = await Company.find().skip(skip).limit(limit);
        const items = companys.map(formatCompany);

        const pagination = {
            currentPage: page,
            currentItems: items.length,
            totalPages,
            totalItems,
            _links: {
                first: {
                    page: 1,
                    href: `${baseUrl}?page=1&limit=${limit}`
                },
                last: {
                    page: totalPages,
                    href: `${baseUrl}?page=${totalPages}&limit=${limit}`
                },
                previous: page > 1 ? {
                    page: page - 1,
                    href: `${baseUrl}?page=${page - 1}&limit=${limit}`
                } : null,
                next: page < totalPages ? {
                    page: page + 1,
                    href: `${baseUrl}?page=${page + 1}&limit=${limit}`
                } : null
            }
        };

        res.json({
            items,
            _links: {
                self: { href: `${baseUrl}?page=${page}&limit=${limit}` }
            },
            pagination
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
        for (let i = 0; i < 30; i++){
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

router.post('/', async (req, res) => {
    try {
        const { title, description, review } = req.body;

        // Valideer invoer
        if (!title || !description || !review) {
            return res.status(400).json({ error: "All fields (title, description, review) are required." });
        }

        // Maak een nieuwe resource aan
        const company = await Company.create({ title, description, review });

        // Gebruik de formatCompany functie om het antwoord te formatteren
        const formattedCompany = formatCompany(company);

        // Stuur de gemaakte resource terug
        res.status(201).json({ item: formattedCompany });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




router.get('/:_id', async (req, res) => {
    try {
        const company = await Company.findById(req.params._id);

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json(
            formatCompany(company),    // Kijk boven voor fucntie
        );
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put('/:_id', async (req, res) => {
    try {
        const { title, description, review } = req.body;

        // Controleer of er minimaal één veld is om bij te werken
        if (!title && !description && !review) {
            return res.status(400).json({ error: "At least one field (title, description, review) is required to update." });
        }

        // Zoek en werk de resource bij... findByIdAndUpdate is van mongoose
        const company = await Company.findByIdAndUpdate(
            req.params._id, // ID van de resource
            { title, description, review }, // Gegevens om bij te werken
            { new: true, runValidators: true } // Retourneer het bijgewerkte document
        );

        if (!company) {
            return res.status(404).json({ error: "Company not found (ID KLOPT TOCH? 😃😃)" });
        }

        // Format de geüpdatete resource en retourneer deze
        res.status(200).json({ item: formatCompany(company) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/:_id', async (req, res) => {
    try {
        const { _id } = req.params;

        // Probeer de resource te verwijderen
        const result = await Company.findByIdAndDelete(_id);

        if (!result) {
            // Als de resource niet bestaat
            return res.status(404).json({ error: "Company not found" });
        }

        // Succesvol verwijderd
        res.status(204).send(); // Geen inhoud teruggeven
    } catch (e) {
        console.error(e); // Log de fout
        res.status(500).json({ error: "Internal Server Error" }); // Onverwachte serverfout
    }
});


export default router;
