import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();

    try {
        // 1️⃣ Authenticate
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2️⃣ Validate input
        const body = await req.json();
        const { name } = body;
        const { id: categoryId } = await params;

        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // 3️⃣ Update category
        const { data, error } = await supabase
            .from("categories")
            .update({ name: name.trim() })
            .eq("id", categoryId)
            .select("id, name, is_default")
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // 4️⃣ Return updated category
        return NextResponse.json(
            {
                id: data.id,
                name: data.name,
                isDefault: data.is_default,
                readOnly: data.is_default,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    };
};


// DELETE endpoint
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();

    try {
        // authenticate the user 
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // parse the linkId
        const { id: categoryId } = await params;

        // delete the categort 
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        };

        // return the response 
        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    };
};
