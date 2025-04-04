import express from "express";
import { getUsers, addUser, updateUser, deleteUser, getUserById } from "../lib/userService.js";
import { authenticate } from "../middleware.js";
import { validateUserSchema } from "./schema.js";

const router = express.Router();

// Middleware autentikasi diterapkan ke semua rute di bawah ini
router.use(authenticate);

// Mendapatkan daftar semua pengguna
router.get("/", async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data pengguna", error });
    }
});

// Mendapatkan data pengguna berdasarkan ID
router.get("/:id", async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data pengguna", error });
    }
});

// Menambahkan pengguna baru
router.post("/", async (req, res) => {
    try {
        const validationError = validateUserSchema(req.body);
        if (validationError) {
            return res.status(400).json({ message: "Data tidak valid", error: validationError });
        }
        
        const newUserId = await addUser(req.body);
        res.status(201).json({ message: "Pengguna berhasil ditambahkan", id: newUserId });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambahkan pengguna", error });
    }
});

// Memperbarui data pengguna
router.put("/:id", async (req, res) => {
    try {
        const validationError = validateUserSchema(req.body);
        if (validationError) {
            return res.status(400).json({ message: "Data tidak valid", error: validationError });
        }
        
        await updateUser(req.params.id, req.body);
        res.status(200).json({ message: "Pengguna berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui pengguna", error });
    }
});

// Menghapus pengguna berdasarkan ID
router.delete("/:id", async (req, res) => {
    try {
        await deleteUser(req.params.id);
        res.status(200).json({ message: "Pengguna berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus pengguna", error });
    }
});

export default router;
