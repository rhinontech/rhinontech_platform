get_goals_response_format = {
    "Goals": [
       {
            "Goal 1": "[Create a full Goal with SMART details(concentrate on one skill at a time, try to make the goal based on the skills, role and type.)]",
       },
       {
            "Goal 2": "[Create a full Goal with SMART details(concentrate on one skill at a time, try to make the goal based on the skills, role and type.)]",
       },
       {
            "Goal 3": "[Create a full Goal with SMART details(concentrate on one skill at a time, try to make the goal based on the skills, role and type.)]",
       }
    ]
}

get_goals_suggestion_format = {
    "next_words": "[Please write a completed goal or give us the next 5-6 words to complete it. Start exactly where the input ended. If the last word of the goal is completed one, add a space before then you add next words like this ' '. (try to keep words as user is writing a goal)]"
}

evaluate_goal_response_format = {
    "data": [
       {
            "key": "specific",
            "value": "[True/False]"
       },
       {
            "key": "measurable",
            "value": "[True/False]"
       },
       {
            "key": "achievable",
            "value": "[True/False]"
       },
       {
            "key": "relevant",
            "value": "[True/False]"
       },
       {
            "key": "time_bouund",
            "value": "[True/False]"
       }
    ],
    "isSmart": "[True/False. (Please analyze very strictly)]",
    "isSmartRating": "[please give a percentage of being smart out of 100%. (Please analyze very strictly)]",
    "feedback": "[very weak, weak, moderate, strong, very strong. (Please analyze very strictly)]"
}


roles_levels = {
    "Individual contributor": "Professionals are usually individuals, who follow standard work routines",
    "Managing Team": "Individuals are Managers, who must have command of procedures & systems and manage individual contributors",
    "Managing Managers": "Professionals are Managers of Managers, who have thorough understanding of their work principles of their line of functions/business",
    "Managing Function": "Professionals are functional managers, who are experts and manage a large set of teams to deliver results in the field of their profession",
    "Managing Business": "Professionals are Business managers, who manage multiple functions and are competent in running a small and mid-size organization or Unit P&L of a large business",
    "Managing Enterprise": "Professionals are CEOs and Group CXOs, who manage multiple business managers and are experts in running large-size organizations or conglomerate"
}