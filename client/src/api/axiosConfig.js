import axios from "axios"

export const api = axios.create({
    baseURL: "https://proyecto-ipvu.onrender.com/api",
    headers: {
        "Content-Type": "application/json"
    }
})