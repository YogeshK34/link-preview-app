import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET endpoint 
export async function GET() {
    const supabase = await createClient();
    try {
        // authenticate user 
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        };

        // fetch visible categories 
        const { data: categories, error } = await supabase
            .from('categories')
            .select('id, name, is_default')
            .or(`is_default.eq.true,user_id.eq.${user.id}`)
            .order('is_default', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        };

        // optional but very important step for UI 
        const result = categories?.map((cat) => ({
            id: cat.id,
            name: cat.name,
            isDefault: cat.is_default,
            readOnly: cat.is_default
        }));

        // return the final response 
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    };
}


// POST endpoint 
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    try {
        // authenticate user 
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        };

        // parse the body 
        const body = await request.json();
        const { name } = body;

        // validate the input
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "Category name is required!" }, { status: 400 })
        };

        // insert user-owned category
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: name.trim(),
                user_id: user.id,
                is_default: false,
            })
            .select('id, name, is_default')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        };

        // return the created category 
        return NextResponse.json(
            {
                id: data.id,
                name: data.name,
                isDefault: data.is_default,
                readOnly: false
            },
            { status: 201 }
        );

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}