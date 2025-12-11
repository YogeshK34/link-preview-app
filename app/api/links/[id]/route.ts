import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // get the link id from URL params
    const { id: linkId } = await params

    // verify the ownership (Imp step)
    const { data: link, error: fetchError } = await supabase.from("links").select("user_id").eq("id", linkId).single()

    if (fetchError || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    if (link.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not your link, you cannot delete this link!" }, { status: 403 })
    }

    // finally delete the link
    const { error: deleteError } = await supabase.from("links").delete().eq("id", linkId)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Link Deleted!" }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  try {
    const { data: { user }, error: AuthError } = await supabase.auth.getUser();

    if (!user || AuthError) {
      return NextResponse.json(
        { error: "Unauthorized" }, { status: 401 })
    };

    // get the link's link from url params 
    const { id: linkId } = await params

    // verify the ownership, not needed actually but stil we'll try to add 
    const { data: link, error: fetchError } = await supabase.from('links').select("user_id").eq("id", linkId).single();

    if (!link || fetchError) {
      return NextResponse.json(
        { error: "Link not found" }, { status: 404 });
    };

    if (link.user_id != user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not your link, you cannot pin this link!" },
        { status: 403 });
    };

    // Get current pinned status to toggle it
    const { data: currentLink, error: currentError } = await supabase
      .from('links')
      .select('pinned')
      .eq('id', linkId)
      .single();

    if (currentError || !currentLink) {
      return NextResponse.json(
        { error: "Failed to fetch link status" },
        { status: 500 }
      );
    }

    // Toggle pinned status
    const newPinnedStatus = !currentLink.pinned;

    // Update the link with new pinned status and pinned_at timestamp
    const { data: updatedLink, error: updateError } = await supabase
      .from('links')
      .update({
        pinned: newPinnedStatus,
        pinned_at: newPinnedStatus ? new Date().toISOString() : null
      })
      .eq('id', linkId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update pin status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: newPinnedStatus ? "Link pinned!" : "Link unpinned!",
        data: updatedLink
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

}
