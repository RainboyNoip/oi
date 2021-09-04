program fill2;
var
 s1,s2:array[0..5000] of longint;
 s1low,s1hi,s2low,s2hi:integer;
 r,l,s,x,i,min1,min2:longint;
function peeksmall:longint;
 begin
  min1:=1000000000;min2:=1000000000;
  if s1low<>s1hi then min1:=s1[s1low];
  if s2low<>s2hi then min2:=s2[s2low];
  if min1<min2 then begin peeksmall:=s1[s1low];inc(s1low); end
               else begin peeksmall:=s2[s2low];inc(s2low); end;
 end;
procedure swap(l:integer;r:integer);
 var tmp:longint;
 begin
  tmp:=s1[r];
  s1[r]:=s1[l];
  s1[l]:=tmp;
 end;
procedure sort(low:integer; hi:integer);
 var l:longint;
begin
 if low>=hi then exit else
 x:=s1[(low+hi)div 2];
 swap(low,(low+hi) div 2);
 l:=low;
 r:=hi;
 while l<r do
  begin
   while ((l<r)and(s1[r]>=x)) do dec(r);
   s1[l]:=s1[r];
   while ((l<r)and(s1[l]<=x)) do inc(l);
   s1[r]:=s1[l];
  end;
  s1[l]:=x;
  sort(low,l-1);
  sort(r+1,hi);
 end;
begin
 read(s1hi);
 for i:=0 to s1hi-1 do
  read(s1[i]);
  sort(0,s1hi-1);
  s:=0;
  for i:=s1hi-1 downto 1 do
   begin
    s2[s2hi]:=peeksmall+peeksmall;
    s:=s+s2[s2hi];
    inc(s2hi);
   end;
  write(s);
end.
