export interface Project {

    id: string;

    title: string;

    description: string;

    tags: string[];

    image?: string;

    status?: string;

    link?: string;

    repo?: string;

    result?: string;

    featured?: boolean;

    overview?: string[];

    myRole?: string;

    technicalChallenges?: { title: string; description: string }[];

    architecture?: string[];

    deepDive?: { title: string; description: string }[];

    links?: {
        github?: string;
        demo?: string;
        docs?: string;
        video?: string;
        steam?: string;
    };

}
