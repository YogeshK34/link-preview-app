import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* eslint-disable */
// here I'll write the POST route for linking categories with links 
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        // authenticate the user 
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        };

        // parse the body & validate inputs 
        const body = await request.json();
        const { linkId, categoryId } = body;

        if (!linkId || !categoryId) {
            return NextResponse.json({ error: "LinkId & CategoryId's are required!" }, { status: 400 });
        };

        // insert 
        const { error } = await supabase
            .from('link_categories')
            .insert({ link_id: linkId, category_id: categoryId });6
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        };

        // successful return 
        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    };
};


// DELETE route 
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();

    try {
        // authenticate user 
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        };

        // parse the body and validate the inputs
        const body = await request.json();
        const { linkId, categoryId } = body;

        if (!linkId || !categoryId) {
            return NextResponse.json({ error: "LinkId and CategoryId are required!" }, { status: 400 });
        };

        // delete the relation 
        const { error } = await supabase
            .from('link_categories')
            .delete()
            .eq('link_id', linkId)
            .eq('category_id', categoryId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        };

        return NextResponse.json(null, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    };
};