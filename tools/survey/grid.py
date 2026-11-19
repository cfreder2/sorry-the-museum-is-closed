import sys
from PIL import Image,ImageDraw
def grid(src,box,out,step=50,scale=1.0):
    im=Image.open(src).convert('RGB').crop(box)
    if scale!=1: im=im.resize((int(im.width*scale),int(im.height*scale)),Image.LANCZOS)
    d=ImageDraw.Draw(im,'RGBA')
    x0,y0=box[0],box[1]
    gx=(x0//step+1)*step
    while gx<box[2]:
        X=(gx-x0)*scale; d.line([(X,0),(X,im.height)],fill=(0,0,255,70) if gx%(step*2) else (255,0,0,110)); 
        if gx%(step*2)==0: d.text((X+2,2),str(gx),fill=(255,0,0,255)); d.text((X+2,im.height-12),str(gx),fill=(255,0,0,255))
        gx+=step
    gy=(y0//step+1)*step
    while gy<box[3]:
        Y=(gy-y0)*scale; d.line([(0,Y),(im.width,Y)],fill=(0,0,255,70) if gy%(step*2) else (255,0,0,110))
        if gy%(step*2)==0: d.text((2,Y+2),str(gy),fill=(255,0,0,255)); d.text((im.width-30,Y+2),str(gy),fill=(255,0,0,255))
        gy+=step
    im.save(out)
if __name__=='__main__':
    a=sys.argv; grid(a[1],tuple(int(v) for v in a[2].split(',')),a[3],int(a[4]) if len(a)>4 else 50,float(a[5]) if len(a)>5 else 1.0)
