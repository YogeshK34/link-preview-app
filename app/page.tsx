"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, UserStar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/*eslint-disable*/
export function LinkPreviewCard({ preview }: { preview: any }) {
  if (!preview) return null;

  return (
    <Card className="w-full max-w-md mt-6 overflow-hidden border border-border rounded-xl shadow-sm">
      {preview.image && (
        <Link href={preview.url} rel='noopener norefferer' target='_blank'>
          <Image
            src={preview.image}
            alt={preview.title}
            width={600}
            height={300}
            className='w-full h-48 object-cover cursor-pointer hover-opacity-90 transition'
          />
        </Link>
      )}

      <CardHeader>
        <CardTitle className="text-lg">
          {preview.title || "No Title"}
        </CardTitle>
        <CardDescription>
          {preview.site_name || preview.url}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {preview.description || "No description available"}
        </p>
      </CardContent>
    </Card>
  );
}


/* eslint-disable */
export default function Home() {
  const [input, setInput] = useState<string>("");
  const [returnedLink, setReturnedLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<any>(null);

  async function handleLinkSubmit() {
    if (input.trim() === "") {
      toast.warning("Input cannot be empty!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: input }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error);
        return;
      }

      const body = await res.json();
      setPreview(body.ogData);
      toast.success("Link submitted successfully!");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 px-4 py-6">
      <Card className="w-full max-w-md shadow-lg border border-border/40 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Link Storer</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-1.5">
                Store your desired GitHub links easily
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* <Button variant='outline'>Hover</Button> */}
                    <HelpCircle />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add your social/profile links to get a preview card.</p>
                  </TooltipContent>
                </Tooltip>
              </CardDescription>
            </div>

            <CardAction>
              {preview ? (
                <Link href={preview.url} target="_blank">
                  <Avatar>
                    <AvatarImage src={preview.image} alt={preview.title} />
                    <AvatarFallback>
                      <UserStar />
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar>
                  <AvatarFallback>
                    <UserStar />
                  </AvatarFallback>
                </Avatar>
              )}
            </CardAction>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Enter the Link
              </Label>
              <Input
                placeholder="https://github.com"
                required
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-10 rounded-md"
              />
            </div>

            <Button
              variant="default"
              type="button"
              onClick={handleLinkSubmit}
              className="w-full h-10 font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="py-6">
          {preview ? (
            <LinkPreviewCard preview={preview} />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No link added yet</EmptyTitle>
                <EmptyDescription>Start by entering a link above</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

        </CardFooter>
      </Card>
    </div>
  );
}