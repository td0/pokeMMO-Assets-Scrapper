const fs = require('fs');
const path = require('path');
const dl = require('download');
const q = require('queue')();
const parser = require('xml2json');
const mkdirp = require('mkdirp');

q.concurrency = 1;
q.autostart = false;
const download_from = process.argv[2]!=null? parseInt(process.argv[2]) : 0;

fs.readFile("./file_sources/list.xml", "utf8", (err,data) => {
  if (err) return console.log(err);
  const xml = JSON.parse(parser.toJson(data));
  let download_count = 0;
  let rFilesPath = [];
  let totalFiles = Object.keys(xml.update_feed.file).length;
  
  for( let x=0; x<totalFiles; x++) rFilesPath[x] = xml.update_feed.file[x].name;
  // rFilesPath.map(x => {
  for( let c=download_from; c<totalFiles; c++) {
    let x = rFilesPath[c]; 
    const file_uri = "http://files.pokemmo.eu/download/client/"+x;
    const file_path = path.join(__dirname,'download/'+x);
    q.push( cb => {
      dl(file_uri).then( data => {
        mkdirp(path.dirname(file_path), ed => {
          if(ed){
            console.log("mkdirp error : "+ed);
            cb(ed);
          }
          fs.writeFile(file_path, data, ew =>{
            if(ew) { 
              console.error("writefile error : "+ew);
              cb(ew);
            }
            console.log(x+" written");
            cb();
          });
        });
      })
      .catch( edw => {
        if(edw){
          console.log(file_path + " download error : " + edw);
          cb(edw);
        }
      });
    }); 
  };

  q.on('success', (result, job)=>{
    // result.catch(e => console.error(e));
    download_count++;
    const index = download_count+download_from;
    process.stdout.write( '-> '+ rFilesPath[index] + ' | '
      + (index)+'/'+totalFiles+' file(s) downloaded\r' );
  });

  q.start(err => {
    if(err) console.log(err);
    else console.log('\nDone!');
  });
});