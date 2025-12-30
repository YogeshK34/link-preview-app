"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";


/* eslint-disable */

type Category = {
    id: string;
    name: string;
    isDefault: boolean;
    readOnly: boolean;
};

export default function Testing() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState<string>("");

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to fetch categories");
                return;
            }

            setCategories(data); // assuming backend returns array directly
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const createCategories = async (e: React.FormEvent) => {
        e.preventDefault();


        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error);
            };

            toast.success("Category created!");
            setName("");
            fetchCategories();

        } catch (error) {
            toast.error("Something went wrong");
        }
    }

    return (
        <div>
            <h2>Testing Categories</h2>

            <Button onClick={fetchCategories}>
                Fetch categories
            </Button>

            <ul>
                {categories.map((cat) => (
                    <li key={cat.id}>
                        {cat.name}
                        {cat.readOnly && " 🔒"}
                    </li>
                ))}
            </ul>

            This will create categories
            <form onSubmit={createCategories}>
                <Input
                    type="text"
                    placeholder="Enter category value"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Button type='submit'>Submit</Button>
            </form>
        </div>
    );
}
