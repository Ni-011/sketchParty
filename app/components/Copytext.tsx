import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Button} from "@/components/ui/button";
import React from "react";
import {Copy, CheckCheck} from "lucide-react";

export const Copytext = ({text} : {text: string}) => {
    const [copy, setCopy] = React.useState<boolean>(false);
    const handleCopy = async () => {
        try {
            if (text) {
                await navigator.clipboard.writeText(text);
                setCopy(true);

                setTimeout(() => {
                    setCopy(false);
                }, 2000)
            }
        } catch (err) {
            console.log("Copy failed", err);
        }
    }

    return (
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
            {
                copy ? (<CheckCheck className="h-4 w-4" />) : (<Copy className="h-4 w-4" />)
            }
        </Button>
    );
}