import constants,{buildPresenceChecklist, METRIC_CONFIG} from "../constants";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";


import "./StyleSheets/Home.css";
import NavBar from "./NavBar/NavBar.jsx";
import { useState, useEffect } from "react";


pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
 
 
export default function Home(){

  const [aiReady, setAiReady] =useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [presenceCheckList, setPresenceCheckList] = useState([]);

  useEffect(()=>{
     const interval = setInterval(()=>{
       if(window.puter?.ai?.chat){
         setAiReady(true);
         clearInterval(interval);
       }
     },300);
     return ()=>{ clearInterval(interval)}
  },[])


 const extractPDFText = async (file)=>{
   const arrayBuffer = await file.arrayBuffer();
   const pdf = await pdfjsLib.getDocument({
    data:arrayBuffer
   }).promise;
   const texts = await Promise.all(
    Array.from({length:pdf.numPages}, (_, i)=> pdf.getPage(i+1)).then((page)=> page.getTextContent().then((tc)=> tc.map((i)=>i.str ).join(" ") ) )
   );
   return  texts.join("\n").trim();
  }

  const parseJosnResponse = (reply)=>{
    try{
      const match = reqply.match(/\{\s\S}*\}/);
      const parsed = match? JSON.parse(match[0]) :{};
      if(!parsed.overAllScore && !parsed.error){
        throw new Error(`Invalid AI response`);
      }
      return parsed;
    }
     catch(err){ throw new Error(`Failsed to parse AI response : ${err.message}`);}
  }


 const analyzeResume = async (text)=>{
   const prompt = constants.ANALYZE_RESUME_PROMPT.replace("{{DOCUMENT_TEXT}}", text);
   const response = await window.puter.ai.chat([
        {role:"system", content:"You are an expert resume reviewer..."},
        {role:"user", content: prompt}
   ],{ model : "gpt-4o"})
   const result = parseJosnResponse(
        typeof response === "string" ? response : response.message?.content || ""
   )
   if(result.error) throw new Error(result.error);
        return result;
 }

 const handleFileUpload = async (e)=>{
    const file = e.tartget.files[0];
    if(!file || file.type !== "application/pdf"){
      return alert("Only Pdf File Supported");
    }
    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceCheckList([]);
    try{
       const text  = await extractPDFText(file);
       setResumeText(text);
       setPresenceCheckList(buildPresenceChecklist(text));
       setAnalysis(await analyzeResume(text));
    }
    catch(err){
      alert(`Error : ${err.message}`);
      reset();
    }
    finally{
      setIsLoading(false);
    }
 }

 const reset = ()=>{
     setUploadedFile(null);
     setAnalysis(null);
     setResumeText("");
     setPresenceCheckList([]);
 }

 return(
     <main>
         <header>
              <nav>
                  <NavBar/>
              </nav>
         </header>
         <h1>Home</h1>
     </main>
  )
}