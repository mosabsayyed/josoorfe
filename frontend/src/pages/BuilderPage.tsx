import React, { useEffect, useState } from "react";
import { BuilderComponent, builder, useIsPreviewing } from "@builder.io/react";

// TO USER: Replace with your actual Public API Key from Builder.io
// You can find this in Account Settings > Public API Key
builder.init("YOUR_BUILDER_PUBLIC_API_KEY");

export default function BuilderPage() {
    const isPreviewingInBuilder = useIsPreviewing();
    const [notFound, setNotFound] = useState(false);
    const [content, setContent] = useState(null);

    useEffect(() => {
        async function fetchContent() {
            const content = await builder
                .get("page", {
                    url: window.location.pathname
                })
                .promise();

            setContent(content);
            setNotFound(!content);
        }

        fetchContent();
    }, [window.location.pathname]);

    if (notFound && !isPreviewingInBuilder) {
        return <div>404 - Page Not Found (Builder.io)</div>;
    }

    return (
        <div style={{ padding: 20 }}>
            {/* 
         This component renders the content from Builder.io.
         If no content is found for the current URL, it shows nothing 
         (unless you're previewing in the Builder editor).
       */}
            <BuilderComponent model="page" content={content} />
        </div>
    );
}
