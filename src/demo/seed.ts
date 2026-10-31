import type { DemoState } from '../types/models';
import { addDays } from '../utils/format';

// Dados fictícios usados somente durante a migração, na Etapa 1.
export const seed: DemoState = {
  users: [
    {id:'u9',role:'student',name:'Beatriz Santos',email:'beatriz@senai.local',password:'Beatriz@123',turma:'3º A',idade:17,matricula:'ALU006',photo:'',suspended:false},
    {id:'u1', role:'director', name:'Diretor SENAI', email:'diretor@senai.local', password:'Senai@123', turma:'Direção', idade:38, matricula:'DIR001', photo:'', suspended:false},
    {id:'u2', role:'teacher', name:'Prof. Rafael', email:'professor@senai.local', password:'Professor@123', turma:'Educação Física', idade:31, matricula:'PROF001', photo:'', suspended:false},
    {id:'u3', role:'teacher', name:'Prof. Camila', email:'camila@senai.local', password:'Camila@123', turma:'Educação Física', idade:29, matricula:'PROF002', photo:'', suspended:false},
    {id:'u4', role:'student', name:'João Silva', email:'aluno@senai.local', password:'Aluno@123', turma:'2º A', idade:16, matricula:'ALU001', photo:'', suspended:false},
    {id:'u5', role:'student', name:'Maria Costa', email:'maria@senai.local', password:'Maria@123', turma:'2º A', idade:16, matricula:'ALU002', photo:'', suspended:false},
    {id:'u6', role:'student', name:'Lucas Souza', email:'lucas@senai.local', password:'Lucas@123', turma:'2º B', idade:17, matricula:'ALU003', photo:'', suspended:false},
    {id:'u7', role:'student', name:'Ana Lima', email:'ana@senai.local', password:'Ana@1234', turma:'2º B', idade:16, matricula:'ALU004', photo:'', suspended:false},
    {id:'u8', role:'student', name:'Pedro Alves', email:'pedro@senai.local', password:'Pedro@123', turma:'3º A', idade:17, matricula:'ALU005', photo:'', suspended:false}
  ],
  teams: [
    {id:'t1', name:'Fênix Azul', status:'ativa', creatorId:'u4', teacherIds:['u2'], memberIds:['u4','u5','u6','u2'], reserveIds:['u7'], wins:4, losses:1, pointsFor:310, pointsAgainst:242},
    {id:'t2', name:'Impacto', status:'ativa', creatorId:'u5', teacherIds:['u3'], memberIds:['u5','u7','u8','u3'], reserveIds:[], wins:2, losses:2, pointsFor:250, pointsAgainst:248},
    {id:'t3', name:'Titãs', status:'ativa', creatorId:'u6', teacherIds:['u2'], memberIds:['u6','u8','u2'], reserveIds:['u4'], wins:3, losses:2, pointsFor:285, pointsAgainst:270}
  ],
  games: [
    {id:'g1', date:addDays(1), time:'14:00', duration:90, court:'Quadra SENAI', team1:'t1', team2:'t2', limit:18, description:'Jogo amistoso', notes:'Chegar 10 minutos antes.', status:'inscricoes', participantIds:['u4','u5','u6','u7'], sets:[], createdBy:'u2'},
    {id:'g2', date:addDays(3), time:'15:30', duration:90, court:'Quadra SENAI', team1:'t2', team2:'t3', limit:18, description:'Rodada interna', notes:'', status:'agendado', participantIds:['u5','u7','u8'], sets:[], createdBy:'u3'},
    {id:'g3', date:addDays(-4), time:'16:00', duration:90, court:'Quadra SENAI', team1:'t1', team2:'t3', limit:18, description:'Treino oficial', notes:'', status:'finalizado', participantIds:['u4','u5','u6','u8'], sets:[{a:25,b:19},{a:22,b:25},{a:15,b:12}], createdBy:'u2'}
  ],
  tournaments: [],
  stats: [
    {userId:'u4', points:62, serves:31, aces:12, blocks:8, attacks:38, errors:7, wins:5, losses:2},
    {userId:'u5', points:55, serves:27, aces:9, blocks:6, attacks:34, errors:8, wins:4, losses:3},
    {userId:'u6', points:48, serves:29, aces:7, blocks:11, attacks:26, errors:6, wins:4, losses:2},
    {userId:'u7', points:41, serves:24, aces:8, blocks:4, attacks:25, errors:5, wins:3, losses:3},
    {userId:'u8', points:37, serves:20, aces:5, blocks:7, attacks:22, errors:9, wins:2, losses:4}
  ],
  logs: [
    {id:'l1', actorId:'u2', action:'criou o jogo Fênix Azul x Impacto', createdAt:new Date().toISOString()},
    {id:'l2', actorId:'u3', action:'atualizou uma equipe', createdAt:new Date(Date.now()-3600000).toISOString()}
  ]
};
