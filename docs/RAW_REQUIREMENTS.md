the # Raw Business Requirements — User's Own Words

Captured verbatim from the audit session (2026-03-06).

---

## Ontology (H items)

the rag of nodes and lines is not fully implemented. I still see solid yellow lines (an impossible state), the logic of the rag of each line/relation, it sketchy, some nodes are not covered (ppl, process, tool) which breaks the link to projects, basically every shape needs a status, otherw wise why did we add it. an umportant point in the logic of the rag for nodes and lines is understanding it is all bottom up. this means for instance, if risk is pushing reds to policy and perf then they shouldbe red too, and if they are red then objectives is also red. This chain concept should be built in how the rags are calculated. Note that the chains have ones that are for planning, this is not what decides the status. The ones bottom up are the ones that aggregate the status and so they define the rag as they progress. I need you to analyze this to code the rag based on the data retrieved. In build mode it starts with change and keeps going up till objectives, and in operate mode it starts with the enterpise elements till objectives. TWO: the sidepanels are still a mess, random data , broken traceability, no CTA, consistently missing the ID in the panel. the whole point of the panel is to drill down to culprit and then use an AI button to analysis the risk/issue and provide the intervention options. risks or issues can only be in their roots either in the enterprise elements (ppl shortage, broken processes, faulty systems, poor vendors, low culture scores etc...) OR if the capability is being built then it goes to the projects closing the gaps in these elements. now, for the status row I just dont like it, stats only and using text, it should be visually more modern and intuitive. I also wanted this row to tell the story and what i got was a one line like sector delivery is healthy. I was thinking we use an AI call to get a short paragraph to insert but unlike the buttons, this would be loaded dynamically. Also, it seems the Ontology it not wired with the yaer/q filters. There is also nothing indicating this for a specific Sector, yet in our case we built the demo based on the Water Sector so that should be clear. The full view of the canvas should be smaller by 5%. on the rag for noeds, other than the buildings with the white icon top, the other shapes need to have their unique way of showing the rag: objects that have a greY platform and a small shape on top that shape should change color, the ones with the circular button get fully ragged.

On god damn orphans and bastards to calulcate line RAGS
it really doesnt need all this confusion, all the nodes are part of a chain, when u traverse if the path stops at one point and doesnt continue then that is an orphan node. the bastards is a node on the chain path that starts in the path and proceeds to the end but has no link from the previous part of the chain, it just appears out of nowhere. u count those and if in a certain leg between two nodes there is a concentration that is 1-15% of the working connections on that leg then yellow, more than 15% red. document this so i dont have to explain every time.

add also, the totals are better poitioned on the visual dashboard near each node and near each line and each line should have the relation name (while acommodating for two way arrows which means two relations depending on the direction and making sure no overlaps happen

---

## System / Boot (S items)

th BIOS screen at start will always be in English and must be LTR regardless of ar/en settings. System should also remeber the last preferences in language, light/dark and date selected.

---

## Observe (O items)

in observe, we changed the db entries for sector outputs and investments to be parse-free. you will need to search the noormemory for the entry with details on this and adjust frontend to make the correct calls. the side panels when i click on a delivery program should show me the policy tools related (assets or otherwise) and the capabilities linked to them which is what happens BUT when there is no L2 policy and hence cap, it shows empty entries which is not right. The status of the capabilities in the color strip is not correct, it should match the status used in the capability matrix. When i click on a capability from this tree, it is supposed to open the capability matrix (app) and auto open the sidepanel there with that capbility, it doesnt do that. The map does not update when the app changes size to full screen. the assets state (existing / planned) should change with the eyar filter, it remains the same. if its due to 2027, then the state should change to existing. The mapping to the pillars, there should be no programs for the third pillar but it seems it shows all programs when selected. Make sure under the first two pillars all the delivery programs and water assets are reflected, no orphans. Once the capabilities status is correct, it needs to aggregate upwards to show the RAG. Use the same rules used in the ontology aggregation. the status should appear on the from cap to policy tool to delivery program to sector objectives.

---

## Decide (D items)

Decide app: the resizing of the app window adjusts the space for the cells, yet in particular the L2 has alot of text and ends up overflowing on to other cells under it, remove the description line from the cell so it is like the others. The l1 and l2 have a KPI- under them, i dont know what this is and what it is supposed to do. THE MAJOR problem is the sidepanels, they continue to be massive dumps of data with no clear purpose to the reader and does not help trace problems (its ed, why and due to what). In specific L2: L3 cap in operation, why is this the first thing before the status? L2 formula and inputs, what formula?! this is a capability, if you want to show the KPI for it, add a referene to the L2 kpi linked to it, and when u go to to the kpi card (which doesnt exist) you should see the details there instead of cramming everything in one place. Even if you take these inputs to a kpi card, they make no sense as they have no reference, just text inputs describing things then some count target and shows it red without the rule of planned vs target TEMPORALLY not in absolute!! Upward link, the most incomprehensible part, a very long list of nothing, random crap that makes no sense. This was supposed to simply show upwards the l1 perf (l2 cap to l2 perf to l1 perf to l1 obj) simple!! in the guage it is not clear what is the value measured or the planned vs target nor the timelines. and to make it worse, right under it is the maturity which a implies the guage is about it yet in fact they are two different measurements. Plus in many cases the maturity shows 1 while it says its in operation which is somthing requiring m3 min. A big mess. L3 : many cases show he guage at 0% while maturity is 5 mashallah and all its siblings are at m5 while the parent somehow is at m1! total disconnect. then the guage numbers are showin way down out ofthe blue in process metrics! then it shows ops footprint which i guess is projects, yet not clear and no idea if these projects are on track or not, and no explanation to why there are projects for an m5 maxed out capability. Lastly the risk profile has two useless inputs cateogry and status - ABSOLUTELY USELESS. The chains and what to read from them is totally wrong and reading from the wrong fields and aggreagating incorrectly. Last point is Exposure overlay, this is supposed to be a gradient coloring based on dynamic min and max values of a formula of risk rating, urgency and depennencies. Not applied.

---

## Deliver (P items)

Deliver: the main point missing is tracking progress. the intervention plans are saved and retrieved perfectly. however, it is not clear how these plans reach users and owners, and how they send back the progress on their tasks. also it is not clear how their status links back to the risk status they are supposed to solve for. once a risk has an intervention plan, the formula caclulating its risk should make it back into Amber (not solved but now under monitoring), if the plan fails there needs to be a trigger to bump it up. and the list of intervention plans should show from the list level the RAG (same formula for projects) and when entering to see the rag per task.

Still deliver, the Strategic Reset is not a Reset, it is a REFRESH, a normal end of year exercise which requires a snapshot as an input to the exercise and workshop. This can be an AI prompt. the page becomes a selection of the year to snapshot, and a prompt in supabase that follows the rules and structure of the other prompts and outlines to the AI how to create a snapshot. this leaves the ai button like the rest to send to the prompt key and a simple query to provide the snapshot for the year selected and returns it. each snapshot is listed and saved for the future. The scenario planning plays into this nicely, the refresh workshop gets the snapshot, and the discussions end with options that need validation, so again this is an ai button etc.. BUT the inputs in the query are much more and dynamic based on the scenario controls. the scenario controls need to be modified where this is outcome based, meaning it lists the outcomes and outputs per the current plan and next to them are the modified values, including an open text area for the prompt, and the button sends this to the ai along with the prompt key to load the new prompt on how to assess this. The output should be a non-biased and ruthless analysis of the viability of the change in outcomes based on current baseline and the vision objectives mandates, and wha it owuld take to achieve them even if tough, if not possible it owuld give the best possible and aggressive plan along witht hte risks for it. again gets saved and listed.

---

## Reporting (R items)

Reporting: with all this wealth o data, we should be able to produce reports on the fly in a variety, We have to start with the standard reports tab not the outcomes one. We know the reports, weekly for all projects for weekly pmo, monthly for programs and operations for Excom (integrating current issues in operations and kpis plus the projects upcoming and operations dependig on them ot increase their capabilities to achieve more targets, and one standard Adaa report. we need one real example of the three based on our data. Outcome based is measuring if the interventions have been effective or not. this can be the risk interventions taken from the Deliver part, or from the refresh. again, can be an AI or can be determinstic script explained by an AI.

---

## Signals (X items)

Signals: needs to be updated with the latest chains we redesigned, as it still refers to chain we cancelled and split. Also, it has an adjustable node limit but it doesnt seem to work now. Lastly is the diagnoze queries, those were supposed to be similar ot the narrative but they highlight break points in the chain where the path did not continue. or nodes that have no predecessor. I called those orphans (abandoned) and bastards (no parent) so when u search u should find this designed before either in docs or memory. it affects the visuals showing red dots on the sankey. this then is discussed with owners to fix data issues.

---

## Expert Chat (C items)

Expert chat. the two buttons recall memory and recall vision are redundant, they are already in the prompts so just causes confusion. The personas though need to be well thought, we r using the same prompts used for the ai buttons, but for this kind of discussion would they still be useful. plus the rule was once u select a persona it gets locked for that session, yet each time a msg is sent the drop down resets to choose a persona. So some tweaking is needed. The main problem though continues to be the conversaiton summary when it hits the limit, we deployed a solution but not tested yet thoroughly. some small but imprtant tweaks, the example prompts in the new chat need to be changed to something more relevant and show the power of the system. the side bar for conversation history used to visually look nicer, had the date and number of msgs, those disappeared. when the rply comes under the msg bubble appears the artifacts, instead of the name of the report it still says html report. when u open an artifact, there is a back to list button that takes u to the list of artifacts for that reply, it now only shows the artifact that was opened only. the user bubble needs to change from green to another color to be more readable. The references in all the prompts talk about "an agency" we neeed to make it clear it is SWA.

---

## Tutorials (TU items)

Tutorials: the look and feel i think needs another pass. most importantly is the videos and audios are now hosted on youtube and we need to change the links from local to embed the youtube versions.

---

## Settings (T items)

Settings: it reads well, but still writing back to DB is not smooth, as in never works. the problem is we need to support multple llm providers, and the sub features differ. the supabase ahs a column listing the features supported by an llm providor which can help in customing the options but this was never done. there is also a feature of injecting graph rag semantic context that we never activated.

---

## Observability (B items)

observability isi in good shape overall but sometimes messages in supabase do not appear. Maybe its related to long threads. Yet parsing the outputs of hte llm to ill in for observability is sometimes dropping fields. Reasoning is not always appearing. Error messages are cryptic, mcp tool calls sometimes are counted and others are not altho they do happen.
